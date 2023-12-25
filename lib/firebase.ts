import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
} from "firebase/firestore";
import { IAccount, IList, IMovie } from "../types";

const firebaseConfig = {
    apiKey: "AIzaSyAmDUDdpWun5VIV-FX78S4aGDvd6GFHym8",
    authDomain: "netflix-mobile-19455.firebaseapp.com",
    projectId: "netflix-mobile-19455",
    storageBucket: "netflix-mobile-19455.appspot.com",
    messagingSenderId: "365571978044",
    appId: "1:365571978044:web:f6f68f55c7517112e56439"
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    db = getFirestore(app);
  } catch (error) {
    console.log("Firebase initialization error");
  }
} else {
  app = getApp();
  auth = getAuth();
  db = getFirestore();
}

export { auth, db };

export const getAccounts = async (uid: string) => {
  const accountsRef = collection(db, "accounts");
  const querySnapshot = await getDocs(accountsRef);
  const accounts: IAccount[] = [];
  querySnapshot.forEach((doc) => {
    accounts.push(doc.data() as IAccount);
  });

  return accounts.filter((account) => account.uid === uid);
};

export const createAccount = async (data: IAccount) => {
  const { _id, name, pin, uid } = data;

  const allAccounts = await getAccounts(uid);

  if (allAccounts.length === 4) {
    return {
      status: false,
      message: "You can't have more than 4 accounts per user",
    };
  }

  for (const account of allAccounts) {
    if (account.name.toLowerCase() === name.toLowerCase()) {
      return {
        status: false,
        message: "You already have an account with this name",
      };
    }
  }

  await addDoc(collection(db, "accounts"), {
    name,
    uid,
    pin,
    _id,
  });

  return { status: true, message: "Account created successfully" };
};

export const deleteAccount = async (id: string) => {
  const accountsRef = collection(db, "accounts");
  const querySnapshot = await getDocs(accountsRef);
  const accounts: { _id: string; id: string }[] = [];
  querySnapshot.forEach((doc) => {
    accounts.push({ _id: doc.data()._id, id: doc.id });
  });

  const account = accounts.find((account) => account._id === id);

  await deleteDoc(doc(db, "accounts", account?.id!));

  return { status: true, message: "Account deleted successfully" };
};

export const getAccount = async (pin: string, accountId: string) => {
  const accountsRef = collection(db, "accounts");
  const querySnapshot = await getDocs(accountsRef);
  const accounts: IAccount[] = [];
  querySnapshot.forEach((doc) => {
    accounts.push(doc.data() as IAccount);
  });

  const account = accounts.find(
    (account) => account.pin === pin && account._id === accountId
  );

  if (!account) {
    return { status: false, message: "Account not found" };
  }

  return { status: true, message: "Account found", data: account };
};

export const createList = async (
  accountId: string,
  data: { poster_path: string; id: number; title: string },
  type: string
) => {
  // Get all lists
  const listsRef = collection(db, "lists");
  const querySnapshot = await getDocs(listsRef);
  const lists: { id: number; accountId: string; title: string }[] = [];
  querySnapshot.forEach((doc) => {
    lists.push(doc.data() as { id: number; accountId: string; title: string });
  });

  // Check if list already exists
  const list = lists.find(
    (list) => list.id === data.id && list.accountId === accountId
  );

  if (list) {
    return { status: false, message: "List already exists" };
  }

  const { poster_path, id, title } = data;
  await addDoc(collection(db, "lists"), {
    accountId,
    poster_path,
    id,
    type,
    title,
  });

  return { status: true, message: "List created successfully" };
};

export const getAllLists = async (accountId: string) => {
  const listsRef = collection(db, "lists");
  const querySnapshot = await getDocs(listsRef);
  const lists: IList[] = [];
  querySnapshot.forEach((doc) => {
    lists.push(doc.data() as IList);
  });

  return lists.filter((list) => list.accountId === accountId);
};