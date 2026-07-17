import { useCallback, useEffect, useState } from "react";
import { financeStorage } from "../lib/storage";
import type { Account, Schedule, ScheduleDraft } from "../types";

export const useFinanceData = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const data = financeStorage.load();
    setAccounts(data.accounts);
    setSchedules(data.schedules);
  }, []);

  useEffect(() => {
    reload();
    setLoading(false);
  }, [reload]);

  const saveAccount = async (account: Omit<Account, "id"> & { id?: string }) => {
    financeStorage.saveAccount(account);
    reload();
  };

  const saveSchedule = async (schedule: ScheduleDraft) => {
    financeStorage.saveSchedule(schedule);
    reload();
  };

  const removeAccount = async (id: string) => {
    financeStorage.removeAccount(id);
    reload();
  };

  const removeSchedule = async (id: string) => {
    financeStorage.removeSchedule(id);
    reload();
  };

  return {
    accounts,
    schedules,
    loading,
    saveAccount,
    saveSchedule,
    removeAccount,
    removeSchedule,
  };
};
