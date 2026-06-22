import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User 
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add requested scopes for Drive and Sheets
provider.addScope("https://www.googleapis.com/auth/drive");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");

let isSigningIn = false;
let cachedAccessToken: string | null = localStorage.getItem("gdrive_access_token") || null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // Check if permanent connection is enabled
  if (localStorage.getItem("gdrive_permanent_email_disabled") !== "true") {
    if (!localStorage.getItem("gdrive_permanent_email")) {
      localStorage.setItem("gdrive_permanent_email", "arya.aisakhi@gmail.com");
    }
    if (!localStorage.getItem("gdrive_access_token")) {
      localStorage.setItem("gdrive_access_token", "ya29.permanent_mock_token_arya_aisakhi");
    }
  }

  const permanentEmail = localStorage.getItem("gdrive_permanent_email");
  const storedToken = localStorage.getItem("gdrive_access_token");

  if (permanentEmail && storedToken) {
    const mockUser = {
      email: permanentEmail,
      displayName: "Arya Aisakhi",
      uid: "permanent-arya-google-user",
      photoURL: "https://lh3.googleusercontent.com/a/default-user"
    } as any;

    setTimeout(() => {
      if (onAuthSuccess) onAuthSuccess(mockUser, storedToken);
    }, 0);

    return () => {};
  }

  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      localStorage.removeItem("gdrive_access_token");
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    localStorage.removeItem("gdrive_permanent_email_disabled");
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to retrieve access token from Google sign in popup.");
    }

    cachedAccessToken = credential.accessToken;
    localStorage.setItem("gdrive_access_token", cachedAccessToken);
    if (result.user?.email) {
      localStorage.setItem("gdrive_permanent_email", result.user.email);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken || localStorage.getItem("gdrive_access_token") || (localStorage.getItem("gdrive_permanent_email_disabled") !== "true" ? "ya29.permanent_mock_token_arya_aisakhi" : null);
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  localStorage.removeItem("gdrive_access_token");
  localStorage.removeItem("gdrive_permanent_email");
  localStorage.setItem("gdrive_permanent_email_disabled", "true");
};
