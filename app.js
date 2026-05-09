const TOTAL_CLASSES = 8;
const STUDENTS_PER_CLASS = 30;

const dateInput = document.getElementById("dateInput");
const themeInput = document.getElementById("themeInput");
const maxScoreInput = document.getElementById("maxScoreInput");
const classSelect = document.getElementById("classSelect");
const scoreBody = document.getElementById("scoreBody");

const saveBtn = document.getElementById("saveBtn");
const csvBtn = document.getElementById("csvBtn");
const clearBtn = document.getElementById("clearBtn");

const statusEl = document.getElementById("status");
const countText = document.getElementById("countText");
const sumText = document.getElementById("sumText");
const avgText = document.getElementById("avgText");

let appData = loadAllData();

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getStorageKey() {
  return "score-collector-v1";
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

function createEmptyStudents() {
  const students = [];
  for (let i = 1; i <= STUDENTS_PER_CLASS; i++) {
    students.push({
      no: i,
      name: "",
      score: ""
    });
  }
  return students;
}

function getCurrentRecord() {
  const key = makeRecordKey();

  if (!appData[key]) {
    appData[key] = {
      date: dateInput.value || todayString(),
      theme: themeInput.value.trim() || "無題",
      maxScore: maxScoreInput.value || 100,
      classNo: classSelect.value,
      students: createEmptyStudents()
    };
  }

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
        <input type="number" class="score-input" data-index="${index}" value="${student.score}" min="0">
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
  const oldKey = makeRecordKey();
  const record = getCurrentRecord();

  record.date = dateInput.value || todayString();
  record.theme = themeInput.value.trim() || "無題";
  record.maxScore = maxScoreInput.value || 100;
  record.classNo = classSelect.value;

  appData[oldKey] = record;
  saveAllData();

  showStatus("保存しました");
}

function autoSave() {
  const record = getCurrentRecord();

  record.date = dateInput.value || todayString();
  record.theme = themeInput.value.trim() || "無題";
  record.maxScore = maxScoreInput.value || 100;
  record.classNo = classSelect.value;

  saveAllData();
}

function loadCurrentRecordToInputs() {
  const record = getCurrentRecord();
  maxScoreInput.value = record.maxScore || 100;
  renderTable();
}

function clearCurrentClass() {
  if (!confirm("このクラスの入力内容を初期化しますか？")) return;

  const key = makeRecordKey();
  appData[key] = {
    date: dateInput.value || todayString(),
    theme: themeInput.value.trim() || "無題",
    maxScore: maxScoreInput.value || 100,
    classNo: classSelect.value,
    students: createEmptyStudents()
  };

  saveAllData();
  renderTable();
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
      student.no,
      student.name,
      student.score
    ]);
  });

  const csv = rows.map(row =>
    row.map(cell => `"${String(cell).replaceAll('"', '""')}"`).join(",")
  ).join("\n");

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });

  const fileName = `得点集計_${record.date}_${record.classNo}組_${record.theme}.csv`
    .replace(/[\\/:*?"<>|]/g, "_");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = fileName;
  a.click();

  URL.revokeObjectURL(a.href);
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
});

classSelect.addEventListener("change", () => {
  loadCurrentRecordToInputs();
});

renderTable();
