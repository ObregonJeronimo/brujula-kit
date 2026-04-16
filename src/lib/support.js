import { db, collection, addDoc, getDocs, getDoc, doc, query, where, orderBy, limit, onSnapshot, serverTimestamp, updateDoc } from "../firebase.js";

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
  // Update last message preview and unread flag
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

export { createSupportCase, sendSupportMessage, getActiveCase, subscribeToMessages, markReadByUser, loadFAQ, getNextCaseNumber };
