import { db, collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, limit, onSnapshot, serverTimestamp, updateDoc, setDoc, deleteDoc } from "../firebase.js";

// Get next correlative case number for a given type ("T" or "C")
async function getNextCaseNumber(type) {
  var prefix = type === "C" ? "C" : "T";
  var q = query(collection(db, "support_cases"), where("type", "==", type === "C" ? "case" : "temporal"), orderBy("caseSeq", "desc"), limit(1));
  var snap = await getDocs(q);
  var nextSeq = 1;
  if (!snap.empty) {
    var last = snap.docs[0].data();
    nextSeq = (last.caseSeq || 0) + 1;
  }
  return { number: "#" + prefix + String(nextSeq).padStart(3, "0"), seq: nextSeq };
}

// Create a new support case (temporal by default)
async function createSupportCase(userId, userName) {
  var next = await getNextCaseNumber("T");
  var caseData = {
    caseNumber: next.number,
    caseSeq: next.seq,
    type: "temporal",
    status: "open",
    urgency: "low",
    assignedTo: null,
    createdAt: serverTimestamp(),
    closedAt: null,
    unreadByAgent: true,
    unreadByUser: false,
    userId: userId,
    userName: userName,
    lastMessage: "",
    lastMessageAt: serverTimestamp()
  };
  var ref = await addDoc(collection(db, "support_cases"), caseData);
  return { id: ref.id, caseNumber: next.number };
}

// Send a message in a support case
async function sendSupportMessage(caseId, text, from) {
  await addDoc(collection(db, "support_cases", caseId, "messages"), {
    text: text,
    from: from,
    timestamp: serverTimestamp()
  });
  var updates = { lastMessage: text.substring(0, 100), lastMessageAt: serverTimestamp() };
  if (from === "user") updates.unreadByAgent = true;
  else updates.unreadByUser = true;
  await updateDoc(doc(db, "support_cases", caseId), updates);
}

// Get the active (open/in_review) case for a user
async function getActiveCase(userId) {
  var q = query(
    collection(db, "support_cases"),
    where("userId", "==", userId),
    where("status", "in", ["open", "in_review"])
  );
  var snap = await getDocs(q);
  if (snap.empty) return null;
  var d = snap.docs[0];
  return Object.assign({ _id: d.id }, d.data());
}

// Subscribe to messages of a specific case (real-time)
function subscribeToMessages(caseId, callback) {
  var q = query(
    collection(db, "support_cases", caseId, "messages"),
    orderBy("timestamp", "asc")
  );
  return onSnapshot(q, function(snap) {
    var msgs = snap.docs.map(function(d) {
      return Object.assign({ _id: d.id }, d.data());
    });
    callback(msgs);
  });
}

// Mark messages as read by user
async function markReadByUser(caseId) {
  await updateDoc(doc(db, "support_cases", caseId), { unreadByUser: false });
}

// Escalate a temporal case (#T) to a formal case (#C)
async function escalateCase(caseId, urgency) {
  var next = await getNextCaseNumber("C");
  await updateDoc(doc(db, "support_cases", caseId), {
    type: "case",
    caseNumber: next.number,
    caseSeq: next.seq,
    urgency: urgency || "medium"
  });
  return next.number;
}

// Transfer case to another agent
async function transferCase(caseId, newAgentUid, newAgentName) {
  await updateDoc(doc(db, "support_cases", caseId), {
    assignedTo: { uid: newAgentUid, nombre: newAgentName }
  });
}

// Change urgency of a case
async function changeUrgency(caseId, newUrgency) {
  await updateDoc(doc(db, "support_cases", caseId), {
    urgency: newUrgency
  });
}

// Get all agents (for transfer selector)
async function getAgentsList() {
  var q = query(collection(db, "usuarios"), where("role", "in", ["agent", "agent_senior", "admin"]));
  var snap = await getDocs(q);
  return snap.docs.map(function(d) {
    var data = d.data();
    return { uid: d.id, nombre: data.nombre || data.username || data.email, role: data.role };
  });
}

// Load FAQ from Firestore, fallback to local
async function loadFAQ(localFaq) {
  try {
    var snap = await getDoc(doc(db, "config", "support_faq"));
    if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
      return snap.data().items;
    }
  } catch (e) { /* fallback */ }
  return localFaq;
}

// ===== SCHEDULE / BUSINESS HOURS =====

var DEFAULT_SCHEDULE = {
  scheduleEnabled: false,
  days: [1, 2, 3, 4, 5], // Mon-Fri
  startHour: "09:00",
  endHour: "18:00",
  offlineMessage: "Estamos fuera del horario de atencion. Podes dejar tu mensaje y te responderemos cuando volvamos."
};

// Load support settings from Firestore
async function loadSupportSettings() {
  try {
    var snap = await getDoc(doc(db, "config", "support_settings"));
    if (snap.exists()) {
      return Object.assign({}, DEFAULT_SCHEDULE, snap.data());
    }
  } catch (e) { /* fallback */ }
  return DEFAULT_SCHEDULE;
}

// Save support settings to Firestore
async function saveSupportSettings(settings) {
  await setDoc(doc(db, "config", "support_settings"), settings);
}

// Check if current time is within business hours
function isWithinSchedule(settings) {
  if (!settings || !settings.scheduleEnabled) return true; // If disabled, always available
  var now = new Date();
  var day = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  if (!settings.days || settings.days.indexOf(day) === -1) return false;
  var timeStr = String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");
  var start = settings.startHour || "09:00";
  var end = settings.endHour || "18:00";
  return timeStr >= start && timeStr < end;
}

// Cleanup: delete closed cases older than 15 days
async function cleanupOldCases() {
  var q = query(collection(db, "support_cases"), where("status", "==", "closed"));
  var snap = await getDocs(q);
  var now = Date.now();
  var fifteenDays = 15 * 24 * 60 * 60 * 1000;
  var deleted = 0;
  for (var i = 0; i < snap.docs.length; i++) {
    var d = snap.docs[i].data();
    if (d.closedAt) {
      var closedTime = new Date(d.closedAt).getTime();
      if (now - closedTime > fifteenDays) {
        await deleteDoc(doc(db, "support_cases", snap.docs[i].id));
        deleted++;
      }
    }
  }
  return deleted;
}

export { createSupportCase, sendSupportMessage, getActiveCase, subscribeToMessages, markReadByUser, loadFAQ, getNextCaseNumber, escalateCase, transferCase, changeUrgency, getAgentsList, cleanupOldCases, loadSupportSettings, saveSupportSettings, isWithinSchedule, DEFAULT_SCHEDULE };
