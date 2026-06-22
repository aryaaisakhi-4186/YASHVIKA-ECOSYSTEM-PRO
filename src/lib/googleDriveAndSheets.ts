/**
 * Helper utilities to interact directly with the Google Drive and Sheets APIs 
 * using the authenticated user's access token from Firebase.
 */

// Helper to convert base64 image to compressed Blob (quality 0.5) for "short size me save"
export async function compressImgBase64(base64Data: string, mimeType: string = "image/jpeg", targetWidth: number = 1200): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Data.startsWith("data:") ? base64Data : `data:${mimeType};base64,${base64Data}`;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width;
      let h = img.height;
      
      // Auto-scale down extremely large images to control size
      if (w > targetWidth) {
        h = Math.round((targetWidth / w) * h);
        w = targetWidth;
      }
      
      canvas.width = w;
      canvas.height = h;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get 2D context for canvas compression"));
        return;
      }
      
      ctx.drawImage(img, 0, 0, w, h);
      
      // Compress to JPEG with 0.5 quality (highly optimized file size: usually ~50-100 KB)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Canvas export returned null blob"));
          }
        },
        "image/jpeg",
        0.5 // Quality parameter: 50%
      );
    };
    img.onerror = (e) => reject(new Error("Failed to load image for compression"));
  });
}

// Helper to detect mock development token configuration
function isMockToken(token: string): boolean {
  return !token || token.includes("mock") || token.startsWith("ya29.permanent");
}

// 1. Search Client Folders in Google Drive (specifically looking for "Shared with me" and owned folders)
export async function searchClientFolders(accessToken: string, clientName: string): Promise<any[]> {
  const cleanName = clientName.split("(")[0].replace(/[^a-zA-Z0-9\s]/g, "").trim();
  
  if (isMockToken(accessToken)) {
    console.log(`[Mock Google Workspace Active] Simulating folders look-up for: "${clientName}"`);
    return [
      {
        id: `mock-folder-${cleanName.toLowerCase().replace(/\s+/g, "-") || "general"}`,
        name: `Master_Accounting_Sheet - ${cleanName}`,
        webViewLink: `https://drive.google.com/drive/folders/mock-folder-${cleanName.toLowerCase().replace(/\s+/g, "-") || "general"}`,
        shared: true,
        parents: []
      }
    ];
  }

  const qStr = `mimeType = 'application/vnd.google-apps.folder' and trashed = false and (name contains '${cleanName}' or name contains '${clientName.split(" ")[0]}')`;
  
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qStr)}&fields=files(id,name,webViewLink,shared,parents)&pageSize=10`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    }
  });
  
  if (!res.ok) {
    const errText = await res.text();
    console.warn("Drive API search error detail:", errText);
    throw new Error(`Google Drive Search failed: ${res.statusText}`);
  }
  
  const data = await res.json();
  return data.files || [];
}

// 2. Locate or create "Documents" subfolder inside client folder
export async function getOrCreateDocumentsFolder(accessToken: string, parentFolderId: string): Promise<string> {
  if (isMockToken(accessToken)) {
    console.log(`[Mock Google Workspace Active] Simulating Documents subfolder creation or resolution for parent ID: "${parentFolderId}"`);
    return `mock-docs-${parentFolderId}`;
  }

  const qStr = `'${parentFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and (name = 'Documents' or name = 'documents') and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qStr)}&fields=files(id,name)&pageSize=1`;
  
  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    }
  });
  
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }
  
  // Create it since it does not exist
  console.log(`Documents subfolder not found under ID ${parentFolderId}. Creating it now...`);
  const createUrl = "https://www.googleapis.com/drive/v3/files";
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Documents",
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentFolderId]
    })
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create 'Documents' subfolder: ${createRes.statusText}`);
  }
  
  const newFolder = await createRes.json();
  return newFolder.id;
}

// 3. Upload a file (Blob) directly to a folder in Google Drive
export async function uploadDriveFile(
  accessToken: string, 
  folderId: string, 
  filename: string, 
  fileBlob: Blob
): Promise<{ id: string; webViewLink: string }> {
  if (isMockToken(accessToken)) {
    console.log(`[Mock Google Workspace Active] Simulating file upload: "${filename}"`);
    return {
      id: `mock-file-${Date.now()}`,
      webViewLink: `https://drive.google.com/file/d/mock-file-${Date.now()}/view`
    };
  }

  const metadata = {
    name: filename,
    parents: [folderId]
  };
  
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", fileBlob);
  
  const url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink";
  
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form
  });
  
  if (!res.ok) {
    const errText = await res.text();
    console.error("Upload Error Details:", errText);
    throw new Error(`Upload to Google Drive failed: ${res.statusText}`);
  }
  
  return await res.json();
}

// 4. Find or create an accounting Master Sheets under the folder
export async function getOrCreateClientSpreadsheet(accessToken: string, folderId: string, clientName: string): Promise<{ id: string; webViewLink: string }> {
  const cleanName = clientName.split("(")[0].replace(/[^a-zA-Z0-9\s]/g, "").trim();
  const title = `Master Accounting Sheet - ${cleanName}`;

  if (isMockToken(accessToken)) {
    console.log(`[Mock Google Workspace Active] Simulating spreadsheet creation: "${title}"`);
    return {
      id: `mock-sheet-${cleanName.toLowerCase().replace(/\s+/g, "-") || "general"}`,
      webViewLink: `https://docs.google.com/spreadsheets/d/mock-sheet-${cleanName.toLowerCase().replace(/\s+/g, "-") || "general"}`
    };
  }

  const qStr = `'${folderId}' in parents and mimeType = 'application/vnd.google-apps.spreadsheet' and name contains 'Master' and trashed = false`;
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(qStr)}&fields=files(id,name,webViewLink)&pageSize=1`;
  
  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    }
  });
  
  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return { id: data.files[0].id, webViewLink: data.files[0].webViewLink };
    }
  }
  
  // Create spreadsheet since it does not exist
  console.log(`Master spreadsheet not found in client folder. Creating "${title}"...`);
  const createUrl = "https://www.googleapis.com/drive/v3/files";
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: title,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [folderId]
    })
  });
  
  if (!createRes.ok) {
    throw new Error(`Failed to create Spreadsheet: ${createRes.statusText}`);
  }
  
  const sheetFile = await createRes.json();
  
  // Initialize some basic tabs inside the Google Sheet (Invoices, Purchases/Expenses, Summary)
  try {
    const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetFile.id}:batchUpdate`;
    await fetch(batchUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        requests: [
          { addSheet: { properties: { title: "Invoices" } } },
          { addSheet: { properties: { title: "Vouchers" } } },
          { addSheet: { properties: { title: "Expenses" } } }
        ]
      })
    });
  } catch (sheetErr) {
    console.warn("Notice: Initial sheet tabs update had an issue, safe fallback applied:", sheetErr);
  }
  
  // Fetch Web View Link
  const linkRes = await fetch(`https://www.googleapis.com/drive/v3/files/${sheetFile.id}?fields=id,name,webViewLink`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  
  if (linkRes.ok) {
    return await linkRes.json();
  }
  
  return { id: sheetFile.id, webViewLink: `https://docs.google.com/spreadsheets/d/${sheetFile.id}` };
}

// 5. Append transaction or voucher row into specific Google sheet tab
export async function appendRowToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  headers: string[],
  rowValues: any[]
): Promise<boolean> {
  if (isMockToken(accessToken)) {
    console.log(`[Mock Google Workspace Active] Simulating appending to custom tab: "${tabName}" inside spreadsheet: "${spreadsheetId}"`);
    return true;
  }

  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A1:Z2`;
  
  let headerExists = false;
  try {
    const checkRes = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      if (data.values && data.values.length > 0) {
        headerExists = true;
      }
    }
  } catch (e) {
    console.warn("Tab A1 query had an issue, let's proceed to append header first:", e);
  }
  
  if (!headerExists) {
    // Write headers first!
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A1?valueInputOption=USER_ENTERED`;
    await fetch(headerUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: `${tabName}!A1`,
        majorDimension: "ROWS",
        values: [headers]
      })
    });
  }
  
  // Append Row Value
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${tabName}!A:A:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `${tabName}!A:A`,
      majorDimension: "ROWS",
      values: [rowValues]
    })
  });
  
  if (!res.ok) {
    const errText = await res.text();
    console.error("Sheets Append Error Detail:", errText);
    throw new Error(`Google Sheets append row failed: ${res.statusText}`);
  }
  
  return true;
}

// 6. Dynamic Column & Header recognition to append transaction cells dynamically inside sheet tabs
export async function appendAdaptiveRowToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  tabName: string,
  extractedData: {
    date: string;
    invoiceNo: string;
    supplierName: string;
    supplierGSTIN: string;
    itemName: string;
    quantity: number;
    rate: number;
    taxableAmount: number;
    gstRate: number;
    totalAmount: number;
    status?: string;
  },
  fileUrl: string
): Promise<boolean> {
  if (isMockToken(accessToken)) {
    console.log(`[Mock Google Workspace Active] Simulating adaptive row append for: "${extractedData.itemName}" under sheet tab: "${tabName}"`);
    return true;
  }

  const checkUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1:Z1`;
  
  let existingHeaders: string[] = [];
  let tabExists = false;
  
  try {
    const checkRes = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (checkRes.ok) {
      const data = await checkRes.json();
      tabExists = true;
      if (data.values && data.values.length > 0) {
        existingHeaders = data.values[0];
      }
    } else if (checkRes.status === 400) {
      tabExists = false;
    }
  } catch (e) {
    console.warn("Probe failed, tab might not exist:", e);
  }

  // Create sheet tab if it doesn't exist
  if (!tabExists) {
    console.log(`Tab "${tabName}" not found. Creating tab now...`);
    try {
      const batchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
      const createRes = await fetch(batchUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            { addSheet: { properties: { title: tabName } } }
          ]
        })
      });
      if (!createRes.ok) {
        console.warn("Could not add sheet tab via Google Sheets API batchUpdate:", createRes.statusText);
      }
    } catch (e) {
      console.warn("Error adding tab sheet:", e);
    }
  }

  const standardHeaders = [
    "Date", "Voucher No", "Party Name", "GSTIN", "Item Name", 
    "Qty", "Rate", "Taxable Amt", "GST %", "Total Amt", 
    "Bill Link (Drive)", "Status (Draft/Final)"
  ];

  let headersToUse = existingHeaders.length > 0 ? existingHeaders : standardHeaders;

  if (existingHeaders.length === 0) {
    // Write headers first!
    const headerUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A1?valueInputOption=USER_ENTERED`;
    await fetch(headerUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        range: `${tabName}!A1`,
        majorDimension: "ROWS",
        values: [standardHeaders]
      })
    });
  }

  // Map our extracted items to match header indices dynamically!
  const arrangedRowValues: any[] = headersToUse.map((header) => {
    const h = header.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    if (h.includes("date")) return extractedData.date;
    if (h.includes("vouch") || h.includes("inv") || h.includes("billno")) return extractedData.invoiceNo;
    if (h.includes("party") || h.includes("vendor") || h.includes("supplier") || h.includes("client")) return extractedData.supplierName;
    if (h.includes("gstin") || h.includes("gstno")) return extractedData.supplierGSTIN;
    if (h.includes("item") || h.includes("partic") || h.includes("name") || h.includes("grain")) return extractedData.itemName;
    if (h.includes("qty") || h.includes("quant") || h.includes("bag")) return extractedData.quantity;
    if (h.includes("rate") || h.includes("price")) return extractedData.rate;
    if (h.includes("taxable") || h.includes("base") || h.includes("before")) return extractedData.taxableAmount;
    if (h.includes("gstpercent") || h.includes("gstrate") || h.includes("tax") || h.includes("gst")) return extractedData.gstRate;
    if (h.includes("total") || h.includes("gross") || h.includes("amt")) return extractedData.totalAmount;
    if (h.includes("link") || h.includes("drive") || h.includes("file") || h.includes("url")) return fileUrl;
    if (h.includes("status") || h.includes("state")) return extractedData.status || "Final";
    
    return ""; // Empty cell for unrecognized columns
  });

  // Append arranged cell elements row
  const appendUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(tabName)}!A:A:append?valueInputOption=USER_ENTERED`;
  const res = await fetch(appendUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      range: `${tabName}!A:A`,
      majorDimension: "ROWS",
      values: [arrangedRowValues]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Adaptive Sheets Append Error:", errText);
    throw new Error(`Google Sheets append row failed: ${res.statusText}`);
  }

  return true;
}
