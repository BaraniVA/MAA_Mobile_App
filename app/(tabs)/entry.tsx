import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Circle,
  CircleCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  PencilLine,
  Pill,
  Plus,
  Sparkles,
  Trash2,
  Volume2,
  X,
} from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";

import { useApp } from "@/context/AppContext";
import { colors, fonts } from "@/constants/theme";

const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

type TabletCard = {
  id: number;
  title: string;
  time: string;
  subtitle: string;
  instruction: string;
  remindAt: string;
};

type ScheduleCard = {
  id: number;
  title: string;
  dayText: string;
  timeText: string;
  badge: string;
  dateObj: Date;
};

function computeBadge(date: Date, now: Date) {
  const diffMs = date.getTime() - now.getTime();
  if (diffMs <= 0) return "now";

  const minutes = Math.round(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.round(hours / 24);
  return `${days}d`;
}

type ReminderLeadOption = {
  label: string;
  days: number;
};

const reminderLeadOptions: ReminderLeadOption[] = [
  { label: "At appointment time", days: 0 },
  { label: "1 day before", days: 1 },
  { label: "2 days before", days: 2 },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function mergeDateAndTime(date: Date, time: Date) {
  const merged = new Date(date);
  merged.setHours(time.getHours(), time.getMinutes(), 0, 0);
  return merged;
}

function serializeTabletTitle(name: string, dose: string, instruction: string) {
  return `Tablet|${name}|${dose}|${instruction}`;
}

function parseTabletTitle(title: string) {
  if (title.startsWith("Tablet|")) {
    const [, name, dose, instruction] = title.split("|");
    return {
      name: name?.trim() || "Tablet",
      dose: dose?.trim() || "1 Tablet",
      instruction: instruction?.trim() || "After food",
    };
  }

  const legacyMatch = title.match(/^Tablet:\s*(.*?)\s*\((.*?)\)\s*-\s*(.*)$/i);
  if (legacyMatch) {
    return {
      name: legacyMatch[1]?.trim() || "Tablet",
      dose: legacyMatch[2]?.trim() || "1 Tablet",
      instruction: legacyMatch[3]?.trim() || "After food",
    };
  }

  return {
    name: title.trim() || "Tablet",
    dose: "1 Tablet",
    instruction: "After food",
  };
}

export default function EntryScreen() {
  const router = useRouter();
  const { reminders, refreshReminders, upsertReminder, removeReminder } = useApp();
  const [showTabletModal, setShowTabletModal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showReminderDropdown, setShowReminderDropdown] = useState(false);
  const [editingTabletId, setEditingTabletId] = useState<number | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<number | null>(null);
  const [completedTabletIds, setCompletedTabletIds] = useState<number[]>([]);
  const [pendingTabletItems, setPendingTabletItems] = useState<TabletCard[]>([]);
  const [pendingScheduleItems, setPendingScheduleItems] = useState<ScheduleCard[]>([]);

  const [tabletName, setTabletName] = useState("");
  const [tabletTime, setTabletTime] = useState(() => {
    const next = new Date();
    next.setHours(8, 0, 0, 0);
    return next;
  });
  const [tabletDose, setTabletDose] = useState("1 Tablet");
  const [tabletInstruction, setTabletInstruction] = useState("After food");

  const [visitReason, setVisitReason] = useState("");
  const [visitDate, setVisitDate] = useState(() => new Date());
  const [visitTime, setVisitTime] = useState(() => {
    const next = new Date();
    next.setHours(16, 0, 0, 0);
    return next;
  });
  const [leadReminderDays, setLeadReminderDays] = useState(1);

  const [activePicker, setActivePicker] = useState<null | "tablet-time" | "visit-date" | "visit-time">(null);

  useFocusEffect(
    useCallback(() => {
      refreshReminders().catch(() => undefined);
    }, [refreshReminders])
  );

  const now = new Date();
  const monthName = now.toLocaleDateString("en-US", { month: "long" });
  const year = now.getFullYear();
  const selectedDay = now.getDate();

  const calendarCells = useMemo(() => {
    const firstDay = new Date(year, now.getMonth(), 1).getDay();
    const totalDays = new Date(year, now.getMonth() + 1, 0).getDate();
    const leading = Array.from({ length: firstDay }, () => null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    return [...leading, ...days];
  }, [now, year]);

  const tabletItems = useMemo<TabletCard[]>(() => {
    return reminders
      .filter((item) => item.repeat === "daily")
      .map((item) => {
        const date = new Date(item.remind_at);
        const parsed = parseTabletTitle(item.title);

        return {
          id: item.id,
          title: parsed.name,
          time: formatTime(date).toUpperCase(),
          subtitle: parsed.dose.toUpperCase(),
          instruction: parsed.instruction,
          remindAt: item.remind_at,
        };
      })
      .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
  }, [reminders]);

  const displayTabletItems = useMemo(() => {
    return [...pendingTabletItems, ...tabletItems].sort(
      (a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()
    );
  }, [pendingTabletItems, tabletItems]);

  const scheduleItems = useMemo<ScheduleCard[]>(() => {
    return reminders
      .filter((item) => item.repeat === "none")
      .filter((item) => !item.title.startsWith("Upcoming visit:"))
      .map((item) => {
        const date = new Date(item.remind_at);
        return {
          id: item.id,
          title: item.title,
          dayText: date
            .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
            .toUpperCase(),
          timeText: date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
          badge: computeBadge(date, now),
          dateObj: date,
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(0, 4);
  }, [reminders]);

  const displayScheduleItems = useMemo(() => {
    return [...pendingScheduleItems, ...scheduleItems]
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime())
      .slice(0, 4);
  }, [pendingScheduleItems, scheduleItems]);

  useEffect(() => {
    setCompletedTabletIds((prev) => prev.filter((id) => displayTabletItems.some((item) => item.id === id)));
  }, [displayTabletItems]);

  const onPickerChange = (_event: DateTimePickerEvent, selected?: Date) => {
    setActivePicker(null);
    if (!selected) return;

    if (activePicker === "tablet-time") {
      setTabletTime(selected);
      return;
    }

    if (activePicker === "visit-date") {
      setVisitDate(selected);
      return;
    }

    if (activePicker === "visit-time") {
      setVisitTime(selected);
    }
  };

  const resetTabletForm = () => {
    setTabletName("");
    setTabletDose("1 Tablet");
    setTabletInstruction("After food");
    setEditingTabletId(null);
  };

  const resetVisitForm = () => {
    setVisitReason("");
    setLeadReminderDays(1);
    setShowReminderDropdown(false);
    setEditingVisitId(null);
  };

  const onAddTablet = async () => {
    const cleanName = tabletName.trim();
    if (!cleanName) return;

    const remindAt = mergeDateAndTime(new Date(), tabletTime).toISOString();
    const tempId = -Date.now();
    const optimisticItem: TabletCard = {
      id: tempId,
      title: cleanName,
      time: formatTime(new Date(remindAt)).toUpperCase(),
      subtitle: tabletDose.toUpperCase(),
      instruction: tabletInstruction,
      remindAt,
    };

    if (!editingTabletId) {
      setPendingTabletItems((prev) => [optimisticItem, ...prev]);
    }
    setShowTabletModal(false);
    resetTabletForm();

    try {
      await upsertReminder({
        id: editingTabletId ?? undefined,
        title: serializeTabletTitle(cleanName, tabletDose, tabletInstruction),
        remindAt,
        repeat: "daily",
      });
    } finally {
      if (!editingTabletId) {
        setPendingTabletItems((prev) => prev.filter((item) => item.id !== tempId));
      }
    }
  };

  const openTabletEditor = (item: TabletCard) => {
    setEditingTabletId(item.id);
    setTabletName(item.title);
    setTabletDose(item.subtitle);
    setTabletInstruction(item.instruction);
    setTabletTime(new Date(item.remindAt));
    setShowTabletModal(true);
  };

  const onDeleteTablet = async (id: number) => {
    if (id < 0) {
      setPendingTabletItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    await removeReminder(id);
    setCompletedTabletIds((prev) => prev.filter((itemId) => itemId !== id));
  };

  const onToggleTabletDone = (id: number) => {
    setCompletedTabletIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const onAddVisit = async () => {
    const cleanReason = visitReason.trim();
    if (!cleanReason) return;

    const appointmentAt = mergeDateAndTime(visitDate, visitTime);
    const tempId = -Date.now();
    if (!editingVisitId) {
      const optimisticVisit: ScheduleCard = {
        id: tempId,
        title: cleanReason,
        dayText: appointmentAt
          .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          .toUpperCase(),
        timeText: appointmentAt.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }),
        badge: computeBadge(appointmentAt, new Date()),
        dateObj: appointmentAt,
      };
      setPendingScheduleItems((prev) => [optimisticVisit, ...prev]);
    }

    setShowVisitModal(false);
    resetVisitForm();

    try {
      await upsertReminder({
        id: editingVisitId ?? undefined,
        title: cleanReason,
        remindAt: appointmentAt.toISOString(),
        repeat: "none",
      });

      if (!editingVisitId && leadReminderDays > 0) {
        const leadTime = new Date(appointmentAt);
        leadTime.setDate(leadTime.getDate() - leadReminderDays);
        await upsertReminder({
          title: `Upcoming visit: ${cleanReason}`,
          remindAt: leadTime.toISOString(),
          repeat: "none",
        });
      }
    } finally {
      if (!editingVisitId) {
        setPendingScheduleItems((prev) => prev.filter((item) => item.id !== tempId));
      }
    }
  };

  const openVisitEditor = (item: ScheduleCard) => {
    setEditingVisitId(item.id);
    setVisitReason(item.title);
    setVisitDate(item.dateObj);
    setVisitTime(item.dateObj);
    setLeadReminderDays(0);
    setShowVisitModal(true);
  };

  const onDeleteVisit = async (id: number) => {
    if (id < 0) {
      setPendingScheduleItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    await removeReminder(id);
  };

  const tabletDoneCount = displayTabletItems.filter((item) => completedTabletIds.includes(item.id)).length;
  const tabletTotalCount = displayTabletItems.length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerWrap}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Heart size={16} color={colors.white} fill={colors.white} />
          </View>
          <View>
            <Text style={styles.logoText}>Maternal</Text>
            <View style={styles.aiRow}>
              <View style={styles.aiDot} />
              <Text style={styles.aiText}>AI ASSISTANT</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <LanguageSelector />
          <TouchableOpacity style={styles.emergencyPillBtn} onPress={() => router.push("/emergency") }>
            <AlertTriangle size={14} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconPillBtn}>
            <Volume2 size={16} color={colors.brand} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>DAILY TABLETS</Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressLine} />
        <Text style={styles.progressText}>{tabletDoneCount}/{tabletTotalCount} Done</Text>
        <TouchableOpacity
          style={styles.plusTopBtn}
          onPress={() => {
            resetTabletForm();
            setShowTabletModal(true);
          }}
        >
          <Plus size={16} color={colors.brand} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabletRow}>
        {displayTabletItems.length ? (
          displayTabletItems.map((item) => {
            const done = completedTabletIds.includes(item.id);
            return (
              <View key={item.id} style={styles.tabletCard}>
                <View style={styles.tabletCardHead}>
                  <View style={styles.tabletIconWrap}>
                    <Sparkles size={14} color="#9AA2BC" />
                  </View>
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity style={styles.cardActionBtn} onPress={() => openTabletEditor(item)}>
                      <PencilLine size={14} color="#8FA1C1" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cardActionBtn} onPress={() => onDeleteTablet(item.id).catch(() => undefined)}>
                      <Trash2 size={14} color="#F06A86" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.tabletTitle}>{item.title}</Text>
                <Text style={styles.tabletTime}>
                  {item.time} • {item.subtitle}
                </Text>
                <Text style={styles.tabletInstruction}>{item.instruction}</Text>
                <TouchableOpacity style={[styles.donePill, done && styles.donePillActive]} onPress={() => onToggleTabletDone(item.id)}>
                  {done ? <CircleCheck size={14} color={colors.white} /> : <Circle size={14} color="#8FA1C1" />}
                  <Text style={[styles.donePillText, done && styles.donePillTextActive]}>{done ? "DONE" : "MARK DONE"}</Text>
                </TouchableOpacity>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>No tablet reminders yet</Text>
            <Text style={styles.emptyCardSub}>Tap + to add your first medication schedule.</Text>
          </View>
        )}
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHead}>
          <Text style={styles.calendarMonth}>{monthName} {year}</Text>
          <View style={styles.calendarArrows}>
            <TouchableOpacity style={styles.arrowBtn}>
              <ChevronLeft size={16} color="#A9B2CA" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.arrowBtn}>
              <ChevronRight size={16} color="#A9B2CA" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekHeader}>
          {weekDays.map((w, index) => (
            <Text key={`${w}-${index}`} style={styles.weekHeaderText}>{w}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {calendarCells.map((day, index) => {
            const active = day === selectedDay;
            return (
              <View key={`${day}-${index}`} style={styles.dayCellWrap}>
                {day ? (
                  <View style={[styles.dayCell, active && styles.dayCellActive]}>
                    <Text style={[styles.dayCellText, active && styles.dayCellTextActive]}>{day}</Text>
                  </View>
                ) : (
                  <View style={styles.dayCellEmpty} />
                )}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.upcomingHeadRow}>
        <Text style={styles.upcomingTitle}>UPCOMING SCHEDULE</Text>
        <TouchableOpacity
          style={styles.plusFloatingBtn}
          onPress={() => {
            resetVisitForm();
            setShowVisitModal(true);
          }}
        >
          <Plus size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.scheduleList}>
        {displayScheduleItems.length ? (
          displayScheduleItems.map((item) => (
            <View key={item.id} style={styles.scheduleCard}>
              <View style={styles.scheduleIconWrap}>
                <Calendar size={18} color="#8FA1C1" />
              </View>
              <View style={styles.scheduleTextWrap}>
                <Text style={styles.scheduleTitle}>{item.title}</Text>
                <Text style={styles.scheduleDate}>
                  {item.dayText} •
                </Text>
                <Text style={styles.scheduleTime}>{item.timeText}</Text>
              </View>
              <View style={styles.scheduleActionsWrap}>
                <View style={styles.scheduleBadge}>
                  <Clock3 size={10} color="#FF7E9F" />
                  <Text style={styles.scheduleBadgeText}>{item.badge}</Text>
                </View>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity style={styles.cardActionBtn} onPress={() => openVisitEditor(item)}>
                    <PencilLine size={14} color="#8FA1C1" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cardActionBtn} onPress={() => onDeleteVisit(item.id).catch(() => undefined)}>
                    <Trash2 size={14} color="#F06A86" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyCardTitle}>No upcoming visits scheduled</Text>
            <Text style={styles.emptyCardSub}>Tap + to add your next appointment.</Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPad} />

      <Modal visible={showTabletModal} animationType="fade" transparent onRequestClose={() => setShowTabletModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowTabletModal(false)} />
          <View style={styles.formCard}>
            <View style={styles.formAccent} />
            <View style={styles.formHeadRow}>
              <View>
                <Text style={styles.formTitle}>Add Tablet</Text>
                <Text style={styles.formSubtitle}>SET YOUR MEDICATION SCHEDULE</Text>
              </View>
              <TouchableOpacity style={styles.formCloseBtn} onPress={() => setShowTabletModal(false)}>
                <X size={18} color="#9BA7C2" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>MEDICATION NAME</Text>
            <View style={styles.fakeInputRow}>
              <Pill size={14} color="#B3BED6" />
              <TextInput
                value={tabletName}
                onChangeText={setTabletName}
                placeholder="e.g. Iron Tablet"
                placeholderTextColor="#BFC8DB"
                style={styles.formInput}
              />
            </View>

            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text style={styles.inputLabel}>TIME</Text>
                <TouchableOpacity style={styles.fakeInputRow} onPress={() => setActivePicker("tablet-time")}>
                  <Clock3 size={14} color="#B3BED6" />
                  <Text style={styles.fakeInputValue}>{formatTime(tabletTime)}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.splitCol}>
                <Text style={styles.inputLabel}>DOSAGE</Text>
                <View style={styles.fakeInputRow}>
                  <TextInput
                    value={tabletDose}
                    onChangeText={setTabletDose}
                    placeholder="1 Tablet"
                    placeholderTextColor="#BFC8DB"
                    style={styles.formInput}
                  />
                </View>
              </View>
            </View>

            <Text style={styles.inputLabel}>INSTRUCTIONS</Text>
            <View style={styles.fakeInputRow}>
              <Bell size={14} color="#B3BED6" />
              <TextInput
                value={tabletInstruction}
                onChangeText={setTabletInstruction}
                placeholder="After food"
                placeholderTextColor="#BFC8DB"
                style={styles.formInput}
              />
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={() => onAddTablet().catch(() => undefined)}>
              <Check size={16} color={colors.white} />
              <Text style={styles.confirmBtnText}>{editingTabletId ? "Update Reminder" : "Add Reminder"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showVisitModal} animationType="fade" transparent onRequestClose={() => setShowVisitModal(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowVisitModal(false)} />
          <View style={styles.formCard}>
            <View style={styles.formAccent} />
            <View style={styles.formHeadRow}>
              <View>
                <Text style={styles.formTitle}>New Visit</Text>
                <Text style={styles.formSubtitle}>SCHEDULE YOUR NEXT CHECKUP</Text>
              </View>
              <TouchableOpacity style={styles.formCloseBtn} onPress={() => setShowVisitModal(false)}>
                <X size={18} color="#9BA7C2" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>REASON / DOCTOR</Text>
            <View style={styles.fakeInputRow}>
              <Heart size={14} color="#B3BED6" />
              <TextInput
                value={visitReason}
                onChangeText={setVisitReason}
                placeholder="e.g. Dr. Smith Checkup"
                placeholderTextColor="#BFC8DB"
                style={styles.formInput}
              />
            </View>

            <View style={styles.splitRow}>
              <View style={styles.splitCol}>
                <Text style={styles.inputLabel}>DATE</Text>
                <TouchableOpacity style={styles.fakeInputRow} onPress={() => setActivePicker("visit-date")}>
                  <Calendar size={14} color="#B3BED6" />
                  <Text style={styles.fakeInputValue}>{formatDate(visitDate)}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.splitCol}>
                <Text style={styles.inputLabel}>TIME</Text>
                <TouchableOpacity style={styles.fakeInputRow} onPress={() => setActivePicker("visit-time")}>
                  <Clock3 size={14} color="#B3BED6" />
                  <Text style={styles.fakeInputValue}>{formatTime(visitTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>SET REMINDER</Text>
            <View style={styles.dropdownWrap}>
              <TouchableOpacity
                style={styles.fakeInputRow}
                onPress={() => setShowReminderDropdown((prev) => !prev)}
              >
                <Bell size={14} color="#B3BED6" />
                <Text style={styles.fakeInputValue}>
                  {reminderLeadOptions.find((item) => item.days === leadReminderDays)?.label ?? "1 day before"}
                </Text>
                <ChevronDown size={16} color="#8EA0C1" />
              </TouchableOpacity>
              {showReminderDropdown ? (
                <View style={styles.dropdownMenu}>
                  {reminderLeadOptions.map((option) => {
                    const active = option.days === leadReminderDays;
                    return (
                      <TouchableOpacity
                        key={option.label}
                        style={[styles.dropdownItem, active && styles.dropdownItemActive]}
                        onPress={() => {
                          setLeadReminderDays(option.days);
                          setShowReminderDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownItemText, active && styles.dropdownItemTextActive]}>{option.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : null}
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={() => onAddVisit().catch(() => undefined)}>
              <Check size={16} color={colors.white} />
              <Text style={styles.confirmBtnText}>{editingVisitId ? "Update Appointment" : "Confirm Appointment"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {activePicker ? (
        <DateTimePicker
          value={activePicker === "visit-date" ? visitDate : activePicker === "visit-time" ? visitTime : tabletTime}
          mode={activePicker === "visit-date" ? "date" : "time"}
          onChange={onPickerChange}
          is24Hour={false}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  content: {
    paddingTop: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  headerWrap: {
    marginTop: 20,
    position: "relative",
    zIndex: 120,
    elevation: 30,
    overflow: "visible",
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 6,
  },
  logoText: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: "#252A39",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  aiDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#25C45E",
  },
  aiText: {
    color: "#8B93AE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
    zIndex: 140,
  },
  pillBtn: {
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F5F6FA",
    borderWidth: 1,
    borderColor: "#ECECF1",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillBtnText: {
    color: "#596079",
    fontSize: 11,
    fontWeight: "700",
  },
  iconPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE2EA",
  },
  emergencyPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#D6285A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D6285A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    color: "#9AA2BC",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    minHeight: 34,
  },
  progressLine: {
    height: 2,
    width: 80,
    borderRadius: 1,
    backgroundColor: "#DCE2EF",
  },
  progressText: {
    marginLeft: 10,
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
  },
  plusTopBtn: {
    position: "absolute",
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE2EA",
  },
  tabletRow: {
    flexDirection: "column",
    gap: 8,
  },
  tabletCard: {
    width: "100%",
    minHeight: 102,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  },
  tabletCardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  tabletIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F7F9FF",
    alignItems: "center",
    justifyContent: "center",
  },
  tabletTitle: {
    color: "#1F2B4D",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 3,
  },
  tabletTime: {
    color: "#7D8FB1",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    lineHeight: 17,
  },
  tabletStatus: {
    marginTop: 6,
    color: "#CFD5E5",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  tabletInstruction: {
    marginTop: 2,
    color: "#9AA7C3",
    fontSize: 12,
    fontWeight: "700",
  },
  donePill: {
    marginTop: 7,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DEE4F2",
    backgroundColor: "#F7FAFF",
    paddingHorizontal: 8,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  donePillActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  donePillText: {
    color: "#6980A8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  donePillTextActive: {
    color: colors.white,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 5,
  },
  cardActionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F5F7FC",
    borderWidth: 1,
    borderColor: "#E5EAF4",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E5EAF4",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emptyCardTitle: {
    color: "#1F2B4D",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 3,
  },
  emptyCardSub: {
    color: "#8FA1C1",
    fontSize: 12,
    fontWeight: "600",
  },
  calendarCard: {
    marginTop: 12,
    borderRadius: 34,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  calendarHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  calendarMonth: {
    fontFamily: fonts.serif,
    color: "#1F2B4D",
    fontSize: 31 / 2,
  },
  calendarArrows: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  arrowBtn: {
    width: 34,
    height: 34,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E6EAF2",
    backgroundColor: "#FAFBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  weekHeaderText: {
    width: 36,
    textAlign: "center",
    color: "#CDD4E6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  daysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCellWrap: {
    width: "14.28%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 8,
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCellActive: {
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  dayCellText: {
    color: "#40527A",
    fontSize: 14,
    fontWeight: "600",
  },
  dayCellTextActive: {
    color: colors.white,
    fontWeight: "800",
  },
  dayCellEmpty: {
    width: 34,
    height: 34,
  },
  upcomingHeadRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  upcomingTitle: {
    color: "#9AA2BC",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 2.1,
  },
  plusFloatingBtn: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  scheduleList: {
    gap: 12,
  },
  scheduleCard: {
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    minHeight: 84,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2,
  },
  scheduleIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F6FD",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  scheduleTextWrap: {
    flex: 1,
  },
  scheduleTitle: {
    color: "#1F2B4D",
    fontSize: 29 / 2,
    fontWeight: "800",
    marginBottom: 3,
  },
  scheduleDate: {
    color: "#8FA1C1",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  scheduleTime: {
    color: "#8FA1C1",
    fontSize: 12,
    fontWeight: "800",
  },
  scheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#FFF1F5",
    borderWidth: 1,
    borderColor: "#FFDCE6",
  },
  scheduleBadgeText: {
    color: "#FF7E9F",
    fontSize: 10,
    fontWeight: "700",
  },
  scheduleActionsWrap: {
    alignItems: "flex-end",
    gap: 8,
  },
  bottomPad: {
    height: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(41, 48, 66, 0.58)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 22,
  },
  formCard: {
    width: "100%",
    borderRadius: 34,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    overflow: "hidden",
    shadowColor: "#111C35",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.2,
    shadowRadius: 26,
    elevation: 10,
  },
  formAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: "#FFA0B7",
  },
  formHeadRow: {
    marginTop: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  formTitle: {
    fontFamily: fonts.serif,
    color: "#1F2B4D",
    fontSize: 34 / 2,
    marginBottom: 2,
  },
  formSubtitle: {
    color: "#8FA1C1",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
  },
  formCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F7FB",
    alignItems: "center",
    justifyContent: "center",
  },
  inputLabel: {
    color: "#90A1C1",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1,
    marginTop: 12,
    marginBottom: 6,
  },
  fakeInputRow: {
    minHeight: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E9EDF5",
    backgroundColor: "#F8FAFE",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dropdownWrap: {
    position: "relative",
    zIndex: 20,
  },
  dropdownMenu: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E4EAF5",
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  dropdownItem: {
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  dropdownItemActive: {
    backgroundColor: "#FFF1F5",
  },
  dropdownItemText: {
    color: "#526482",
    fontSize: 12,
    fontWeight: "700",
  },
  dropdownItemTextActive: {
    color: colors.brand,
    fontWeight: "900",
  },
  fakeInputValue: {
    flex: 1,
    color: "#263555",
    fontSize: 13,
    fontWeight: "700",
  },
  formInput: {
    flex: 1,
    color: "#263555",
    fontSize: 13,
    fontWeight: "700",
    paddingVertical: 9,
  },
  splitRow: {
    flexDirection: "row",
    gap: 10,
  },
  splitCol: {
    flex: 1,
  },
  confirmBtn: {
    marginTop: 18,
    height: 50,
    borderRadius: 18,
    backgroundColor: colors.brand,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 6,
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 17 / 1.1,
    fontWeight: "900",
  },
});
