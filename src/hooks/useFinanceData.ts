import { useCallback, useEffect, useState } from "react";
import { financeStorage } from "../lib/storage";
import type { Account, Schedule, ScheduleDraft, ScheduleOccurrenceOverride, ScheduleOccurrenceOverrideDraft } from "../types";

export const useFinanceData = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [occurrenceOverrides, setOccurrenceOverrides] = useState<ScheduleOccurrenceOverride[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    const data = financeStorage.load();
    setAccounts(data.accounts);
    setSchedules(data.schedules);
    setOccurrenceOverrides(data.occurrenceOverrides);
  }, []);

  useEffect(() => {
    reload();
    setLoading(false);
  }, [reload]);

  const saveAccount = async (account: Omit<Account, "id"> & { id?: string }) => {
    financeStorage.saveAccount(account);
    // localStorage is the source of truth. Reload every related collection so
    // all projections use one consistent snapshot immediately after saving.
    reload();
  };

  const saveSchedule = async (schedule: ScheduleDraft) => {
    financeStorage.saveSchedule(schedule);
    reload();
  };

  const saveOccurrenceOverride = async (override: ScheduleOccurrenceOverrideDraft) => {
    financeStorage.saveOccurrenceOverride(override);
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
    occurrenceOverrides,
    loading,
    saveAccount,
    saveSchedule,
    saveOccurrenceOverride,
    removeAccount,
    removeSchedule,
  };
};
