const TOTAL_CLASSES = 8;
const DEFAULT_STUDENTS_PER_CLASS = 30;

const dateInput = document.getElementById("dateInput");
const themeInput = document.getElementById("themeInput");
const maxScoreInput = document.getElementById("maxScoreInput");
const classSelect = document.getElementById("classSelect");
const classCountInput = document.getElementById("classCountInput");

const scoreBody = document.getElementById("scoreBody");
const historyBody = document.getElementById("historyBody");
const studentHistoryBody = document.getElementById("studentHistoryBody");
const studentHistoryTitle = document.getElementById("studentHistoryTitle");

const saveBtn = document.getElementById("saveBtn");
const csvBtn = document.getElementById("csvBtn");
const clearBtn = document.getElementById("clearBtn");

const statusEl = document.getElementById("status");
const countText = document.getElementById("countText");
const sumText = document.getElementById("sumText");
const avgText = document.getElementById("avgText");

let appData = loadAllData();
let appSettings = loadSettings();

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getStorageKey() {
  return "score-collector-v2";
}

function getSettingsKey() {
  return "score-collector-settings-v1";
}

function makeRecordKey() {
  const date = dateInput.value || todayString();
  const theme = themeInput.value.trim() || "無題";
  const classNo = classSelect.value;
  return `${date}__${theme}__${classNo}`;
}

function loadAllData() {
  try {
    const raw = localStorage.getItem(getStorageKey());
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveAllData() {
  localStorage.setItem(getStorageKey(), JSON.stringify(appData));
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(getSettingsKey());
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const classCounts = {};
  for (let i = 1; i <= TOTAL_CLASSES; i++) {
    classCounts[String(i)] = DEFAULT_STUDENTS_PER_CLASS;
  }

  return { classCounts };
}

function saveSettings() {
  localStorage.setItem(getSettingsKey(), JSON.stringify(appSettings));
}

function getClassCount(classNo = classSelect.value) {
  const count = Number(appSettings.classCounts[String(classNo)]);
  if (!count || count < 1) return DEFAULT_STUDENTS_PER_CLASS;
  return count;
}

function setClassCount(classNo, count) {
  const safeCount = Math.max(1, Math.min(60, Number(count) || DEFAULT_STUDENTS_PER_CLASS));
  appSettings.classCounts[String(classNo)] = safeCount;
  saveSettings();
}

function createEmptyStudents(count) {
  const students = [];

  for (let i = 1; i <= count; i++) {
    students.push({
      no: i,
      name: "",
      score: ""
    });
  }

  return students;
}

function adjustStudentsLength(students, count) {
  const list = Array.isArray(students) ? students : [];

  for (let i = 0; i < count; i++) {
    if (!list[i]) {
      list[i] = {
        no: i + 1,
        name: "",
        score: ""
      };
    }

    list[i].no = i + 1;
  }

  return list.slice(0, count);
}

function getCurrentRecord() {
  const key = makeRecordKey();
  const classNo = classSelect.value;
  const count = getClassCount(classNo);

  if (!appData[key]) {
    appData[key] = {
      date: dateInput.value || todayString(),
      theme: themeInput.value.trim() || "無題",
      maxScore: maxScoreInput.value || 100,
      classNo,
      classCount: count,
      students: createEmptyStudents(count),
      updatedAt: new Date().toISOString()
    };
  }

  appData[key].classCount = count;
  appData[key].students = adjustStudentsLength(appData[key].students, count);

  return appData[key];
}

function renderTable() {
  const record = getCurrentRecord();
  scoreBody.innerHTML = "";

  record.students.forEach((student, index) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="no">${student.no}</td>
      <td class="name">
        <input type="text" class="name-input" data-index="${index}" value="${escapeHtml(student.name)}">
      </td>
      <td class="score">
        <input type="number" class="score-input" data-index="${index}" value="${student.score}" min="0" max="${record.maxScore || 100}">
      </td>
      <td>
        <button type="button" class="history-btn" data-index="${index}">履歴</button>
      </td>
    `;

    scoreBody.appendChild(tr);
  });

  document.querySelectorAll(".name-input").forEach(input => {
    input.addEventListener("input", e => {
      const index = Number(e.target.dataset.index);
      record.students[index].name = e.target.value;
      autoSave();
    });
  });

  document.querySelectorAll(".score-input").forEach(input => {
    input.addEventListener("input", e => {
      const index = Number(e.target.dataset.index);
      record.students[index].score = e.target.value;
      autoSave();
      updateSummary();
    });
  });

  document.querySelectorAll(".history-btn").forEach(button => {
    button.addEventListener("click", e => {
      const index = Number(e.target.dataset.index);
      const student = record.students[index];
      renderStudentHistory(student.no, student.name);
    });
  });

  updateSummary();
}

function updateSummary() {
  const record = getCurrentRecord();

  let count = 0;
  let sum = 0;

  record.students.forEach(student => {
    const score = Number(student.score);

    if (student.score !== "" && !isNaN(score)) {
      count++;
      sum += score;
    }
  });

  const avg = count > 0 ? (sum / count).toFixed(1) : "0";

  countText.textContent = count;
  sumText.textContent = sum;
  avgText.textContent = avg;
}

function saveCurrentRecord() {
  const key = makeRecordKey();
  const record = getCurrentRecord();

  record.date = dateInput.value || todayString();
  record.theme = themeInput.value.trim() || "無題";
  record.maxScore = maxScoreInput.value || 100;
  record.classNo = classSelect.value;
  record.classCount = getClassCount();
  record.updatedAt = new Date().toISOString();

  appData[key] = record;
  saveAllData();

  renderHistory();
  showStatus("保存しました");
}

function autoSave() {
  const key = makeRecordKey();
  const record = getCurrentRecord();

  record.date = dateInput.value || todayString();
  record.theme = themeInput.value.trim() || "無題";
  record.maxScore = maxScoreInput.value || 100;
  record.classNo = classSelect.value;
  record.classCount = getClassCount();
  record.updatedAt = new Date().toISOString();

  appData[key] = record;
  saveAllData();

  renderHistory();
}

function loadCurrentRecordToInputs() {
  const record = getCurrentRecord();

  maxScoreInput.value = record.maxScore || 100;
  classCountInput.value = getClassCount();

  renderTable();
  renderHistory();
  clearStudentHistoryMessage();
}

function clearCurrentClass() {
  if (!confirm("このクラスの入力内容を初期化しますか？")) return;

  const key = makeRecordKey();
  const count = getClassCount();

  appData[key] = {
    date: dateInput.value || todayString(),
    theme: themeInput.value.trim() || "無題",
    maxScore: maxScoreInput.value || 100,
    classNo: classSelect.value,
    classCount: count,
    students: createEmptyStudents(count),
    updatedAt: new Date().toISOString()
  };

  saveAllData();
  renderTable();
  renderHistory();
  clearStudentHistoryMessage();

  showStatus("初期化しました");
}

function exportCSV() {
  const record = getCurrentRecord();

  const rows = [];

  rows.push([
    "日付",
    "テーマ",
    "満点",
    "クラス",
    "人数設定",
    "番号",
    "名前",
    "得点"
  ]);

  record.students.forEach(student => {
    rows.push([
      record.date,
      record.theme,
      record.maxScore,
      `${record.classNo}組`,
      record.classCount,
      student.no,
      student.name,
      student.score
    ]);
  });

  const csv = rows.map(row =>
    row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")
  ).join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const fileName = `得点集計_${record.date}_${record.classNo}組_${record.theme}.csv`
    .replace(/[\\/:*?"<>|]/g, "_");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(a.href);
}

function renderHistory() {
  if (!historyBody) return;

  const currentClass = classSelect.value;

  const records = Object.values(appData)
    .filter(record => String(record.classNo) === String(currentClass))
    .sort((a, b) => {
      const ad = a.updatedAt || a.date || "";
      const bd = b.updatedAt || b.date || "";
      return bd.localeCompare(ad);
    })
    .slice(0, 10);

  historyBody.innerHTML = "";

  if (records.length === 0) {
    historyBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;">まだ記録がありません</td>
      </tr>
    `;
    return;
  }

  records.forEach(record => {
    let count = 0;
    let sum = 0;

    record.students.forEach(student => {
      const score = Number(student.score);

      if (student.score !== "" && !isNaN(score)) {
        count++;
        sum += score;
      }
    });

    const avg = count > 0 ? (sum / count).toFixed(1) : "0";

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${record.date || ""}</td>
      <td>${escapeHtml(record.theme || "")}</td>
      <td>${record.classNo}組</td>
      <td>${record.maxScore || ""}</td>
      <td>${count}</td>
      <td>${avg}</td>
    `;

    historyBody.appendChild(tr);
  });
}

function renderStudentHistory(studentNo, studentName) {
  if (!studentHistoryBody) return;

  const currentClass = classSelect.value;

  studentHistoryTitle.textContent = `個人の得点履歴：${currentClass}組 ${studentNo}番 ${studentName || "名前未入力"}`;

  const records = Object.values(appData)
    .filter(record => String(record.classNo) === String(currentClass))
    .sort((a, b) => {
      const ad = a.updatedAt || a.date || "";
      const bd = b.updatedAt || b.date || "";
      return bd.localeCompare(ad);
    });

  const rows = [];

  records.forEach(record => {
    const student = record.students.find(s => Number(s.no) === Number(studentNo));

    if (!student) return;

    if (student.score === "" || student.score === null || student.score === undefined) return;

    rows.push({
      date: record.date || "",
      theme: record.theme || "",
      classNo: record.classNo || "",
      no: student.no,
      name: student.name || studentName || "",
      score: student.score,
      maxScore: record.maxScore || ""
    });
  });

  const latestRows = rows.slice(0, 10);

  studentHistoryBody.innerHTML = "";

  if (latestRows.length === 0) {
    studentHistoryBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;">この生徒の得点履歴はまだありません</td>
      </tr>
    `;
    return;
  }

  latestRows.forEach(row => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.date}</td>
      <td>${escapeHtml(row.theme)}</td>
      <td>${row.classNo}組</td>
      <td>${row.no}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${escapeHtml(row.score)}</td>
      <td>${escapeHtml(row.maxScore)}</td>
    `;

    studentHistoryBody.appendChild(tr);
  });
}

function clearStudentHistoryMessage() {
  if (!studentHistoryBody) return;

  studentHistoryTitle.textContent = "個人の得点履歴";
  studentHistoryBody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align:center;">履歴ボタンを押すと表示されます</td>
    </tr>
  `;
}

function showStatus(message) {
  statusEl.textContent = message;

  setTimeout(() => {
    statusEl.textContent = "";
  }, 2500);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

dateInput.value = todayString();
classCountInput.value = getClassCount();

saveBtn.addEventListener("click", saveCurrentRecord);
csvBtn.addEventListener("click", exportCSV);
clearBtn.addEventListener("click", clearCurrentClass);

dateInput.addEventListener("change", () => {
  loadCurrentRecordToInputs();
});

themeInput.addEventListener("change", () => {
  loadCurrentRecordToInputs();
});

maxScoreInput.addEventListener("input", () => {
  autoSave();
  renderTable();
});

classSelect.addEventListener("change", () => {
  classCountInput.value = getClassCount();
  loadCurrentRecordToInputs();
});

classCountInput.addEventListener("change", () => {
  const classNo = classSelect.value;
  setClassCount(classNo, classCountInput.value);

  const record = getCurrentRecord();
  record.classCount = getClassCount();
  record.students = adjustStudentsLength(record.students, getClassCount());
  record.updatedAt = new Date().toISOString();

  saveAllData();
  renderTable();
  renderHistory();
  clearStudentHistoryMessage();

  showStatus(`${classNo}組の人数を${getClassCount()}人にしました`);
});

renderTable();
renderHistory();
clearStudentHistoryMessage();
