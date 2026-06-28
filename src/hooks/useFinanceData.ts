import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { sampleAccounts, sampleSchedules } from "../data/sample";
import { db } from "../lib/firebase";
import type { Account, Schedule, ScheduleDraft } from "../types";

const withoutId = <T extends { id?: string }>(value: T) => {
  const { id: _id, ...rest } = value;
  return rest;
};

export const useFinanceData = (uid?: string) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(Boolean(uid && db));
  const demoMode = !uid || !db;

  useEffect(() => {
    if (demoMode) {
      setAccounts(sampleAccounts);
      setSchedules(sampleSchedules);
      setLoading(false);
      return;
    }

    const currentDb = db;
    if (!currentDb) return;

    const accountQuery = query(collection(currentDb, "users", uid, "accounts"), orderBy("displayOrder"));
    const scheduleQuery = query(collection(currentDb, "users", uid, "schedules"), orderBy("date"));

    const unsubscribeAccounts = onSnapshot(accountQuery, (snapshot) => {
      setAccounts(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Account));
      setLoading(false);
    });
    const unsubscribeSchedules = onSnapshot(scheduleQuery, (snapshot) => {
      setSchedules(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Schedule));
    });

    return () => {
      unsubscribeAccounts();
      unsubscribeSchedules();
    };
  }, [demoMode, uid]);

  const refs = useMemo(() => {
    const currentDb = db;
    if (!uid || !currentDb) return null;
    return {
      account: (id: string) => doc(currentDb, "users", uid, "accounts", id),
      accounts: collection(currentDb, "users", uid, "accounts"),
      schedule: (id: string) => doc(currentDb, "users", uid, "schedules", id),
      schedules: collection(currentDb, "users", uid, "schedules"),
    };
  }, [uid]);

  const saveAccount = async (account: Omit<Account, "id"> & { id?: string }) => {
    if (!refs) return;
    if (account.id) {
      await setDoc(refs.account(account.id), withoutId(account));
    } else {
      await addDoc(refs.accounts, withoutId(account));
    }
  };

  const saveSchedule = async (schedule: ScheduleDraft) => {
    if (!refs) return;
    if (schedule.id) {
      await setDoc(refs.schedule(schedule.id), withoutId(schedule));
    } else {
      await addDoc(refs.schedules, withoutId(schedule));
    }
  };

  const removeAccount = async (id: string) => {
    if (!refs) return;
    await deleteDoc(refs.account(id));
  };

  const removeSchedule = async (id: string) => {
    if (!refs) return;
    await deleteDoc(refs.schedule(id));
  };

  const seedSampleData = async () => {
    if (!refs) return;
    await Promise.all([
      ...sampleAccounts.map(({ id, ...account }) => setDoc(refs.account(id), account)),
      ...sampleSchedules.map(({ id, ...schedule }) => setDoc(refs.schedule(id), schedule)),
    ]);
  };

  return {
    accounts,
    schedules,
    loading,
    demoMode,
    saveAccount,
    saveSchedule,
    removeAccount,
    removeSchedule,
    seedSampleData,
  };
};
