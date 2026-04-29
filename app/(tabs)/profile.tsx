import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { AlertTriangle, ChevronDown, ChevronUp, FileText, Heart, Settings, ShieldCheck, UserRound, Volume2 } from "lucide-react-native";
import { LanguageSelector } from "@/components/LanguageSelector";

import { colors, fonts } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { healthFeedItems } from "@/data/healthFeed";
import {
  addInsuranceClaimDocument,
  getClinicianDraft,
  getInsuranceClaimDocuments,
  getInsuranceClaims,
  getInsurancePolicies,
  getRecentEntriesForReport,
  getRecentSymptomLogs,
  saveInsuranceClaim,
  saveInsurancePolicy,
  upsertClinicianDraft,
} from "@/db/helpers";
import { pregnancyWeek } from "@/services/date";
import { ClaimStatus, InsuranceClaim, InsuranceClaimDocument, InsurancePolicy } from "@/types";

const milestones = [
  { title: "First Ultrasound", week: "WEEK 12" },
  { title: "Anatomy Scan", week: "WEEK 20" },
  { title: "Glucose Test", week: "WEEK 24" },
  { title: "Third Trimester", week: "WEEK 28" },
] as const;

const claimStatuses: ClaimStatus[] = ["draft", "submitted", "in_review", "approved", "rejected"];

function parseNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

function daysUntil(dateValue: string | null): number | null {
  if (!dateValue) return null;
  const target = new Date(dateValue);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

export default function ProfileScreen() {
  const router = useRouter();
  const { db, profile, feedActivity, upsertReminder } = useApp();
  const [activityTab, setActivityTab] = useState<"liked" | "saved">("liked");
  const [reportDraft, setReportDraft] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    temperatureC: "",
    glucoseMgDl: "",
    medications: "",
    questions: "",
  });
  const [reportSummary, setReportSummary] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [isClinicianOpen, setIsClinicianOpen] = useState(false);
  const [isInsuranceOpen, setIsInsuranceOpen] = useState(false);

  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [claimDocsMap, setClaimDocsMap] = useState<Record<number, InsuranceClaimDocument[]>>({});

  const [policyForm, setPolicyForm] = useState({
    provider: "",
    policyNumber: "",
    maternityCoveragePercent: "80",
    deductible: "",
    outOfPocketLimit: "",
    maternityCoverLimit: "",
    renewalDate: "",
  });
  const [coverageEstimator, setCoverageEstimator] = useState("15000");

  const [claimForm, setClaimForm] = useState({
    title: "",
    status: "draft" as ClaimStatus,
    estimatedAmount: "",
    submissionDeadline: "",
    notes: "",
  });

  const week = profile?.due_date ? pregnancyWeek(profile.due_date) : 24;
  const displayName = profile?.name?.trim() ? profile.name : "Mama Bear";

  const progress = useMemo(() => {
    const pct = Math.max(0, Math.min(100, Math.round((week / 40) * 100)));
    return pct;
  }, [week]);

  const likedItems = useMemo(() => {
    const likedSet = new Set(feedActivity.filter((item) => item.liked === 1).map((item) => item.slug));
    return healthFeedItems.filter((item) => likedSet.has(item.slug));
  }, [feedActivity]);

  const savedItems = useMemo(() => {
    const savedSet = new Set(feedActivity.filter((item) => item.saved === 1).map((item) => item.slug));
    return healthFeedItems.filter((item) => savedSet.has(item.slug));
  }, [feedActivity]);

  const visibleActivity = activityTab === "liked" ? likedItems : savedItems;

  const refreshInsuranceHub = useCallback(async () => {
    const [nextPolicies, nextClaims] = await Promise.all([getInsurancePolicies(db), getInsuranceClaims(db)]);
    setPolicies(nextPolicies);
    setClaims(nextClaims);

    if (nextClaims.length === 0) {
      setClaimDocsMap({});
      return;
    }

    const docsEntries = await Promise.all(
      nextClaims.map(async (claim) => [claim.id, await getInsuranceClaimDocuments(db, claim.id)] as const)
    );

    setClaimDocsMap(Object.fromEntries(docsEntries));
  }, [db]);

  useEffect(() => {
    const load = async () => {
      const draft = await getClinicianDraft(db);
      if (draft) {
        setReportDraft({
          bpSystolic: draft.bp_systolic ? String(draft.bp_systolic) : "",
          bpDiastolic: draft.bp_diastolic ? String(draft.bp_diastolic) : "",
          temperatureC: draft.temperature_c ? String(draft.temperature_c) : "",
          glucoseMgDl: draft.glucose_mg_dl ? String(draft.glucose_mg_dl) : "",
          medications: draft.medications ?? "",
          questions: draft.questions ?? "",
        });
      }

      await refreshInsuranceHub();
    };

    load().catch(() => undefined);
  }, [db, refreshInsuranceHub]);

  const onSaveClinicianDraft = async () => {
    await upsertClinicianDraft(db, {
      medications: reportDraft.medications,
      questions: reportDraft.questions,
      bpSystolic: parseNullableNumber(reportDraft.bpSystolic),
      bpDiastolic: parseNullableNumber(reportDraft.bpDiastolic),
      temperatureC: parseNullableNumber(reportDraft.temperatureC),
      glucoseMgDl: parseNullableNumber(reportDraft.glucoseMgDl),
    });
    Alert.alert("Saved", "Clinician report draft saved.");
  };

  const onGenerateReport = async () => {
    setReportBusy(true);
    try {
      const [entries, symptomLogs] = await Promise.all([
        getRecentEntriesForReport(db, 14),
        getRecentSymptomLogs(db, 14),
      ]);

      const avgWater = entries.length
        ? (entries.reduce((sum, item) => sum + item.water_glasses, 0) / entries.length).toFixed(1)
        : "0";
      const latestWeight = entries.find((item) => item.weight !== null)?.weight;

      const symptomLines = symptomLogs.length
        ? symptomLogs.slice(0, 8).map((item) => `- ${item.date}: ${item.symptom} (${item.severity})`)
        : ["- No symptom logs in last 14 days"];

      const notesLines = entries
        .map((item) => item.notes?.trim())
        .filter((item): item is string => Boolean(item))
        .slice(0, 4)
        .map((note) => `- ${note}`);

      const reportText = [
        "Maa Clinician Share Report",
        `Patient: ${displayName}`,
        `Pregnancy Week: ${week}`,
        `Generated: ${new Date().toLocaleString()}`,
        "",
        "Vitals (latest manual)",
        `- BP: ${reportDraft.bpSystolic || "--"}/${reportDraft.bpDiastolic || "--"} mmHg`,
        `- Temperature: ${reportDraft.temperatureC || "--"} C`,
        `- Glucose: ${reportDraft.glucoseMgDl || "--"} mg/dL`,
        latestWeight !== undefined && latestWeight !== null ? `- Weight: ${latestWeight} kg` : "- Weight: --",
        "",
        "Symptoms (last 14 days)",
        ...symptomLines,
        "",
        "Medication/Supplements",
        reportDraft.medications.trim() ? reportDraft.medications.trim() : "None noted",
        "",
        "Questions for Appointment",
        reportDraft.questions.trim() ? reportDraft.questions.trim() : "None noted",
        "",
        "Daily Summary (last 14 days)",
        `- Entries logged: ${entries.length}`,
        `- Avg water intake: ${avgWater} glasses/day`,
        "",
        "Recent Notes",
        ...(notesLines.length ? notesLines : ["- No notes in the recent window"]),
      ].join("\n");

      setReportSummary(reportText);
      return reportText;
    } catch {
      Alert.alert("Report error", "Could not generate clinician report right now.");
      return "";
    } finally {
      setReportBusy(false);
    }
  };

  const onShareReport = async () => {
    const next = reportSummary.trim() || (await onGenerateReport()).trim();
    if (!next) return;
    await Share.share({ message: next });
  };

  const onSavePolicy = async () => {
    if (!policyForm.provider.trim() || !policyForm.policyNumber.trim()) {
      Alert.alert("Missing info", "Provider and policy number are required.");
      return;
    }

    await saveInsurancePolicy(db, {
      provider: policyForm.provider,
      policyNumber: policyForm.policyNumber,
      maternityCoveragePercent: Number(policyForm.maternityCoveragePercent) || 0,
      deductible: parseNullableNumber(policyForm.deductible),
      outOfPocketLimit: parseNullableNumber(policyForm.outOfPocketLimit),
      maternityCoverLimit: parseNullableNumber(policyForm.maternityCoverLimit),
      renewalDate: policyForm.renewalDate.trim() || null,
    });

    await refreshInsuranceHub();
    Alert.alert("Saved", "Insurance policy added.");
  };

  const onSaveClaim = async () => {
    if (!claimForm.title.trim()) {
      Alert.alert("Missing info", "Claim title is required.");
      return;
    }

    await saveInsuranceClaim(db, {
      policyId: policies[0]?.id ?? null,
      title: claimForm.title,
      status: claimForm.status,
      estimatedAmount: parseNullableNumber(claimForm.estimatedAmount),
      submissionDeadline: claimForm.submissionDeadline.trim() || null,
      notes: claimForm.notes,
    });

    if (claimForm.submissionDeadline.trim()) {
      const remindAt = new Date(`${claimForm.submissionDeadline.trim()}T09:00:00`).toISOString();
      await upsertReminder({
        title: `Insurance claim deadline: ${claimForm.title.trim()}`,
        remindAt,
        repeat: "none",
      });
    }

    setClaimForm({
      title: "",
      status: "draft",
      estimatedAmount: "",
      submissionDeadline: "",
      notes: "",
    });

    await refreshInsuranceHub();
    Alert.alert("Saved", "Claim saved and reminder scheduled when deadline is set.");
  };

  const onUploadClaimDocument = async (claimId: number) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: ["application/pdf", "image/*"],
      });

      if (result.canceled || !result.assets.length) return;
      const picked = result.assets[0];

      await addInsuranceClaimDocument(db, {
        claimId,
        name: picked.name || "Claim document",
        uri: picked.uri,
        mimeType: picked.mimeType ?? null,
      });

      await refreshInsuranceHub();
      Alert.alert("Uploaded", "Document attached to claim.");
    } catch {
      Alert.alert("Upload error", "Could not upload document right now.");
    }
  };

  const primaryPolicy = policies[0] ?? null;
  const expectedExpense = Number(coverageEstimator) || 0;
  const rawCovered = primaryPolicy ? expectedExpense * (primaryPolicy.maternity_coverage_percent / 100) : 0;
  const capLimit = primaryPolicy?.maternity_cover_limit ?? null;
  const cappedCovered = capLimit !== null ? Math.min(rawCovered, capLimit) : rawCovered;
  const outOfPocketEstimate = Math.max(0, expectedExpense - cappedCovered);

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

      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <UserRound size={36} color={colors.white} />
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings size={14} color="#AAB5CB" />
        </TouchableOpacity>

        <Text style={styles.nameText}>{displayName}</Text>
        <Text style={styles.weekText}>{week} WEEKS PREGNANT</Text>
      </View>

      <View style={styles.journeyHead}>
        <Text style={styles.sectionTitle}>YOUR JOURNEY</Text>
        <Text style={styles.completeText}>% COMPLETE</Text>
      </View>

      <View style={styles.journeyCard}>
        <View style={styles.progressMetaRow}>
          <Text style={styles.progressMeta}>WEEK 1</Text>
          <Text style={styles.progressCount}>0 / 40</Text>
          <Text style={styles.progressMeta}>WEEK 40</Text>
        </View>

        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarBase} />
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.progressLabelsRow}>
          <Text style={styles.progressLabel}>CONCEPTION</Text>
          <Text style={styles.progressLabel}>TRIMESTER 2</Text>
          <Text style={styles.progressLabel}>DUEDATE</Text>
        </View>

        <View style={styles.trimesterRow}>
          <View style={styles.trimesterIcon}>
            <Heart size={14} color={colors.brand} />
          </View>
          <View style={styles.trimesterTextWrap}>
            <Text style={styles.trimesterTitle}>Third Trimester</Text>
            <Text style={styles.trimesterSub}>WEEK 28 - 40</Text>
          </View>
          <View style={styles.activeBadge}>
            <Text style={styles.activeBadgeText}>Active</Text>
          </View>
        </View>

        <View style={styles.timelineWrap}>
          {milestones.map((item, idx) => (
            <View key={item.title} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={styles.timelineDot} />
                {idx < milestones.length - 1 ? <View style={styles.timelineLine} /> : null}
              </View>
              <View>
                <Text style={styles.timelineTitle}>{item.title}</Text>
                <Text style={styles.timelineWeek}>{item.week}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.activityHead}>
        <Text style={styles.sectionTitle}>YOUR ACTIVITY</Text>
      </View>

      <View style={styles.activityCard}>
        <View style={styles.activityTabsRow}>
          <TouchableOpacity
            style={[styles.activityTabBtn, activityTab === "liked" && styles.activityTabBtnActive]}
            onPress={() => setActivityTab("liked")}
          >
            <Text style={[styles.activityTabText, activityTab === "liked" && styles.activityTabTextActive]}>LIKED</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.activityTabBtn, activityTab === "saved" && styles.activityTabBtnActive]}
            onPress={() => setActivityTab("saved")}
          >
            <Text style={[styles.activityTabText, activityTab === "saved" && styles.activityTabTextActive]}>SAVED</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activityList}>
          {visibleActivity.length === 0 ? (
            <Text style={styles.activityEmptyText}>No {activityTab} feeds yet.</Text>
          ) : (
            visibleActivity.map((item) => (
              <View key={item.slug} style={styles.activityRow}>
                <View style={styles.activityBullet} />
                <View style={styles.activityTextWrap}>
                  <Text style={styles.activityTitle}>{item.title}</Text>
                  <Text style={styles.activityMeta}>{item.section} • {item.stage}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={styles.dropdownWrap}>
        <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsClinicianOpen((prev) => !prev)}>
          <View style={styles.featureHeadLeft}>
            <View style={styles.featureHeadIconWrap}>
              <FileText size={14} color={colors.brand} />
            </View>
            <Text style={styles.sectionTitle}>CLINICIAN SHARE REPORT</Text>
          </View>
          {isClinicianOpen ? <ChevronUp size={16} color="#7E8FAF" /> : <ChevronDown size={16} color="#7E8FAF" />}
        </TouchableOpacity>

        {isClinicianOpen ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureSubtitle}>Prepare and share a concise report before appointments.</Text>

            <View style={styles.vitalsRow}>
              <TextInput
                value={reportDraft.bpSystolic}
                onChangeText={(value) => setReportDraft((prev) => ({ ...prev, bpSystolic: value }))}
                placeholder="BP SYS"
                keyboardType="numeric"
                style={styles.vitalsInput}
              />
              <TextInput
                value={reportDraft.bpDiastolic}
                onChangeText={(value) => setReportDraft((prev) => ({ ...prev, bpDiastolic: value }))}
                placeholder="BP DIA"
                keyboardType="numeric"
                style={styles.vitalsInput}
              />
              <TextInput
                value={reportDraft.temperatureC}
                onChangeText={(value) => setReportDraft((prev) => ({ ...prev, temperatureC: value }))}
                placeholder="Temp C"
                keyboardType="decimal-pad"
                style={styles.vitalsInput}
              />
              <TextInput
                value={reportDraft.glucoseMgDl}
                onChangeText={(value) => setReportDraft((prev) => ({ ...prev, glucoseMgDl: value }))}
                placeholder="Glucose"
                keyboardType="decimal-pad"
                style={styles.vitalsInput}
              />
            </View>

            <TextInput
              value={reportDraft.medications}
              onChangeText={(value) => setReportDraft((prev) => ({ ...prev, medications: value }))}
              placeholder="Medication and supplements"
              placeholderTextColor="#9EAAC2"
              multiline
              style={styles.featureTextArea}
            />

            <TextInput
              value={reportDraft.questions}
              onChangeText={(value) => setReportDraft((prev) => ({ ...prev, questions: value }))}
              placeholder="Questions for your clinician"
              placeholderTextColor="#9EAAC2"
              multiline
              style={styles.featureTextArea}
            />

            <View style={styles.featureActionsRow}>
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => onSaveClinicianDraft().catch(() => undefined)}>
                <Text style={styles.secondaryActionText}>Save Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryActionBtn} onPress={() => onGenerateReport().catch(() => undefined)}>
                <Text style={styles.primaryActionText}>{reportBusy ? "Generating..." : "Generate"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => onShareReport().catch(() => undefined)}>
                <Text style={styles.secondaryActionText}>Share</Text>
              </TouchableOpacity>
            </View>

            {reportSummary ? (
              <View style={styles.reportPreviewWrap}>
                <Text style={styles.reportPreviewTitle}>Preview</Text>
                <Text numberOfLines={12} style={styles.reportPreviewText}>{reportSummary}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={styles.dropdownWrap}>
        <TouchableOpacity style={styles.dropdownHeader} onPress={() => setIsInsuranceOpen((prev) => !prev)}>
          <View style={styles.featureHeadLeft}>
            <View style={styles.featureHeadIconWrap}>
              <ShieldCheck size={14} color={colors.brand} />
            </View>
            <Text style={styles.sectionTitle}>INSURANCE & CLAIMS HUB</Text>
          </View>
          {isInsuranceOpen ? <ChevronUp size={16} color="#7E8FAF" /> : <ChevronDown size={16} color="#7E8FAF" />}
        </TouchableOpacity>

        {isInsuranceOpen ? (
          <View style={styles.featureCard}>
            <Text style={styles.featureSubtitle}>Store policy details, estimate coverage, and track claim submissions.</Text>

            <TextInput
              value={policyForm.provider}
              onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, provider: value }))}
              placeholder="Provider"
              placeholderTextColor="#9EAAC2"
              style={styles.featureInput}
            />
            <TextInput
              value={policyForm.policyNumber}
              onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, policyNumber: value }))}
              placeholder="Policy number"
              placeholderTextColor="#9EAAC2"
              style={styles.featureInput}
            />

          <View style={styles.doubleRow}>
          <TextInput
            value={policyForm.maternityCoveragePercent}
            onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, maternityCoveragePercent: value }))}
            placeholder="Coverage %"
            placeholderTextColor="#9EAAC2"
            keyboardType="decimal-pad"
            style={styles.featureInputHalf}
          />
          <TextInput
            value={policyForm.renewalDate}
            onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, renewalDate: value }))}
            placeholder="Renewal YYYY-MM-DD"
            placeholderTextColor="#9EAAC2"
            style={styles.featureInputHalf}
          />
          </View>

          <View style={styles.doubleRow}>
          <TextInput
            value={policyForm.deductible}
            onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, deductible: value }))}
            placeholder="Deductible"
            placeholderTextColor="#9EAAC2"
            keyboardType="decimal-pad"
            style={styles.featureInputHalf}
          />
          <TextInput
            value={policyForm.outOfPocketLimit}
            onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, outOfPocketLimit: value }))}
            placeholder="Out-of-pocket"
            placeholderTextColor="#9EAAC2"
            keyboardType="decimal-pad"
            style={styles.featureInputHalf}
          />
          </View>

            <TextInput
              value={policyForm.maternityCoverLimit}
              onChangeText={(value) => setPolicyForm((prev) => ({ ...prev, maternityCoverLimit: value }))}
              placeholder="Maternity cover limit"
              placeholderTextColor="#9EAAC2"
              keyboardType="decimal-pad"
              style={styles.featureInput}
            />

            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => onSavePolicy().catch(() => undefined)}>
              <Text style={styles.primaryActionText}>Save Policy</Text>
            </TouchableOpacity>

          <View style={styles.estimatorCard}>
          <Text style={styles.estimatorTitle}>Coverage Estimator</Text>
          <TextInput
            value={coverageEstimator}
            onChangeText={setCoverageEstimator}
            placeholder="Expected maternity expense"
            placeholderTextColor="#9EAAC2"
            keyboardType="decimal-pad"
            style={styles.featureInput}
          />
          <Text style={styles.estimatorLine}>Estimated covered: {cappedCovered.toFixed(0)}</Text>
          <Text style={styles.estimatorLine}>Estimated out-of-pocket: {outOfPocketEstimate.toFixed(0)}</Text>
          <Text style={styles.estimatorHint}>Applies your stored coverage percent and maternity cap.</Text>
          </View>

            <Text style={styles.claimTitle}>Claims</Text>
            <TextInput
              value={claimForm.title}
              onChangeText={(value) => setClaimForm((prev) => ({ ...prev, title: value }))}
              placeholder="Claim title"
              placeholderTextColor="#9EAAC2"
              style={styles.featureInput}
            />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
          {claimStatuses.map((status) => {
            const active = claimForm.status === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.statusChip, active && styles.statusChipActive]}
                onPress={() => setClaimForm((prev) => ({ ...prev, status }))}
              >
                <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>{status.replace("_", " ")}</Text>
              </TouchableOpacity>
            );
          })}
          </ScrollView>

          <View style={styles.doubleRow}>
          <TextInput
            value={claimForm.estimatedAmount}
            onChangeText={(value) => setClaimForm((prev) => ({ ...prev, estimatedAmount: value }))}
            placeholder="Estimated amount"
            placeholderTextColor="#9EAAC2"
            keyboardType="decimal-pad"
            style={styles.featureInputHalf}
          />
          <TextInput
            value={claimForm.submissionDeadline}
            onChangeText={(value) => setClaimForm((prev) => ({ ...prev, submissionDeadline: value }))}
            placeholder="Deadline YYYY-MM-DD"
            placeholderTextColor="#9EAAC2"
            style={styles.featureInputHalf}
          />
          </View>

            <TextInput
              value={claimForm.notes}
              onChangeText={(value) => setClaimForm((prev) => ({ ...prev, notes: value }))}
              placeholder="Claim notes"
              placeholderTextColor="#9EAAC2"
              multiline
              style={styles.featureTextArea}
            />

            <TouchableOpacity style={styles.primaryActionBtn} onPress={() => onSaveClaim().catch(() => undefined)}>
              <Text style={styles.primaryActionText}>Save Claim</Text>
            </TouchableOpacity>

          <View style={styles.claimListWrap}>
          {claims.length === 0 ? (
            <Text style={styles.claimEmptyText}>No claims yet.</Text>
          ) : (
            claims.map((claim) => {
              const claimDocs = claimDocsMap[claim.id] ?? [];
              const dueIn = daysUntil(claim.submission_deadline);
              return (
                <View key={claim.id} style={styles.claimItemCard}>
                  <View style={styles.claimItemTop}>
                    <Text style={styles.claimItemTitle}>{claim.title}</Text>
                    <View style={styles.claimStatusBadge}>
                      <Text style={styles.claimStatusText}>{claim.status.replace("_", " ")}</Text>
                    </View>
                  </View>

                  <Text style={styles.claimItemMeta}>Amount: {claim.estimated_amount ?? "--"}</Text>
                  <Text style={styles.claimItemMeta}>Deadline: {claim.submission_deadline ?? "--"}</Text>
                  {dueIn !== null ? (
                    <Text style={[styles.claimItemMeta, dueIn <= 3 ? styles.claimItemUrgent : undefined]}>
                      {dueIn >= 0 ? `Reminder: due in ${dueIn} day(s)` : `Reminder: overdue by ${Math.abs(dueIn)} day(s)`}
                    </Text>
                  ) : null}

                  <TouchableOpacity
                    style={styles.secondaryActionBtn}
                    onPress={() => onUploadClaimDocument(claim.id).catch(() => undefined)}
                  >
                    <Text style={styles.secondaryActionText}>Upload Document</Text>
                  </TouchableOpacity>

                  {claimDocs.length > 0 ? (
                    <View style={styles.docListWrap}>
                      {claimDocs.map((doc) => (
                        <Text key={doc.id} style={styles.docItemText}>• {doc.name}</Text>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.docEmptyText}>No documents attached.</Text>
                  )}
                </View>
              );
            })
          )}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomPad} />
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
  avatarSection: {
    alignItems: "center",
    marginTop: 12,
    position: "relative",
  },
  avatarWrap: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 7,
  },
  settingsBtn: {
    position: "absolute",
    top: 62,
    right: 118,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#EAEFF8",
    alignItems: "center",
    justifyContent: "center",
  },
  nameText: {
    marginTop: 14,
    fontFamily: fonts.serif,
    fontSize: 34 / 2,
    fontStyle: "italic",
    color: "#1D2E52",
  },
  weekText: {
    marginTop: 8,
    color: "#8EA0C2",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  journeyHead: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#8EA0C2",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },
  completeText: {
    color: colors.brand,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  journeyCard: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    overflow: "hidden",
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  progressMetaRow: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressMeta: {
    color: "#8193B3",
    fontSize: 12,
    fontWeight: "800",
  },
  progressCount: {
    color: "#657BA4",
    fontSize: 13,
    fontWeight: "900",
  },
  progressBarTrack: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  progressBarBase: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EFF3F9",
  },
  progressBarFill: {
    position: "absolute",
    left: 20,
    top: 0,
    bottom: 0,
    borderRadius: 7,
    backgroundColor: "#DDE4F1",
    height: 14,
  },
  progressLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  progressLabel: {
    color: "#C0CADE",
    fontSize: 9,
    fontWeight: "800",
  },
  trimesterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  trimesterIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E8EDF6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  trimesterTextWrap: {
    flex: 1,
  },
  trimesterTitle: {
    color: "#1F2B4D",
    fontSize: 28 / 2,
    fontWeight: "800",
    marginBottom: 3,
  },
  trimesterSub: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "800",
  },
  activeBadge: {
    backgroundColor: "#FFE7ED",
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  activeBadgeText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
  },
  timelineWrap: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: 56,
  },
  timelineLeft: {
    width: 28,
    alignItems: "center",
    marginRight: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D8DEEB",
    marginTop: 4,
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#E7ECF5",
    marginTop: 2,
  },
  timelineTitle: {
    color: "#8598BA",
    fontSize: 15 / 1.02,
    fontWeight: "700",
    marginBottom: 2,
  },
  timelineWeek: {
    color: "#A3B1CC",
    fontSize: 11,
    fontWeight: "800",
  },
  activityHead: {
    marginTop: 12,
  },
  activityCard: {
    backgroundColor: colors.white,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    padding: 14,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  activityTabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  activityTabBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#F7F9FF",
    borderWidth: 1,
    borderColor: "#E8EDF8",
    alignItems: "center",
    justifyContent: "center",
  },
  activityTabBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  activityTabText: {
    color: "#8EA0C2",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  activityTabTextActive: {
    color: colors.white,
  },
  activityList: {
    gap: 10,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginTop: 6,
  },
  activityTextWrap: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
    paddingBottom: 10,
  },
  activityTitle: {
    color: "#1F2B4D",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },
  activityMeta: {
    color: "#8EA0C2",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  activityEmptyText: {
    color: "#9CA9C4",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 16,
  },
  featureHead: {
    marginTop: 12,
  },
  dropdownWrap: {
    marginTop: 12,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#ECEFF6",
    overflow: "hidden",
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  dropdownHeader: {
    minHeight: 56,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F8",
  },
  featureHeadLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureHeadIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFF0F4",
    borderWidth: 1,
    borderColor: "#FFD8E5",
    alignItems: "center",
    justifyContent: "center",
  },
  featureCard: {
    backgroundColor: colors.white,
    padding: 14,
    gap: 10,
  },
  featureSubtitle: {
    color: "#7D8FB0",
    fontSize: 12,
    fontWeight: "700",
  },
  vitalsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  vitalsInput: {
    flexBasis: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#223352",
    fontSize: 12,
    fontWeight: "700",
  },
  featureInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#223352",
    fontSize: 13,
    fontWeight: "700",
  },
  featureInputHalf: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#223352",
    fontSize: 13,
    fontWeight: "700",
  },
  featureTextArea: {
    minHeight: 84,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#F8FAFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#223352",
    fontSize: 13,
    fontWeight: "600",
    textAlignVertical: "top",
  },
  featureActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  primaryActionBtn: {
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  secondaryActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FBFF",
    paddingHorizontal: 12,
  },
  secondaryActionText: {
    color: "#5E739B",
    fontSize: 12,
    fontWeight: "800",
  },
  reportPreviewWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#F9FBFF",
    padding: 10,
    gap: 6,
  },
  reportPreviewTitle: {
    color: "#546A93",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  reportPreviewText: {
    color: "#2A3A5A",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  estimatorCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#F9FBFF",
    padding: 10,
    gap: 6,
  },
  estimatorTitle: {
    color: "#546A93",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  estimatorLine: {
    color: "#2A3A5A",
    fontSize: 12,
    fontWeight: "700",
  },
  estimatorHint: {
    color: "#7A89A8",
    fontSize: 11,
    fontWeight: "600",
  },
  claimTitle: {
    color: "#536993",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 4,
  },
  statusRow: {
    gap: 8,
  },
  statusChip: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9FBFF",
  },
  statusChipActive: {
    borderColor: colors.brand,
    backgroundColor: "#FFF0F4",
  },
  statusChipText: {
    color: "#5E739B",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  statusChipTextActive: {
    color: colors.brand,
  },
  doubleRow: {
    flexDirection: "row",
    gap: 8,
  },
  claimListWrap: {
    gap: 10,
  },
  claimItemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#FAFCFF",
    padding: 10,
    gap: 6,
  },
  claimItemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  claimItemTitle: {
    flex: 1,
    color: "#253657",
    fontSize: 13,
    fontWeight: "800",
  },
  claimStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#FFF0F4",
  },
  claimStatusText: {
    color: colors.brand,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "capitalize",
  },
  claimItemMeta: {
    color: "#6E82A6",
    fontSize: 11,
    fontWeight: "700",
  },
  claimItemUrgent: {
    color: "#B3224F",
  },
  docListWrap: {
    borderTopWidth: 1,
    borderTopColor: "#EAF0FA",
    paddingTop: 8,
    gap: 4,
  },
  docItemText: {
    color: "#5E739B",
    fontSize: 11,
    fontWeight: "700",
  },
  docEmptyText: {
    color: "#99A8C3",
    fontSize: 11,
    fontWeight: "700",
  },
  claimEmptyText: {
    color: "#9CA9C4",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 6,
  },
  bottomPad: {
    height: 18,
  },
});
