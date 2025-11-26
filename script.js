const addButton = document.getElementById('addRecipient');
const container = document.getElementById('recipientsContainer');
const attachmentInput = document.getElementById('attachment');
const attachmentLabel = document.querySelector('.custom-file-upload');

// אלמנט להצגת שם הקובץ
let fileInfo = document.createElement('div');
fileInfo.id = "fileInfo";
fileInfo.style.marginTop = "5px";
attachmentLabel.parentNode.insertBefore(fileInfo, attachmentLabel.nextSibling);

// הוספת שורה חדשה לנמען
addButton.addEventListener('click', () => {
  const newRow = document.createElement('div');
  newRow.classList.add('recipientRow');
  newRow.innerHTML = `
    <input type="text" name="recipients[]" placeholder="כתובת מייל" required>
    <button type="button" class="deleteRecipient"><i class="fas fa-trash"></i></button>
  `;
  container.appendChild(newRow);
  attachDelete(newRow);
});

// מחיקת שורה
function attachDelete(row) {
  const btn = row.querySelector('.deleteRecipient');
  btn.addEventListener('click', () => {
    row.remove();
  });
}

// צורף מחיקה גם לשורה הראשונה
document.querySelectorAll('.recipientRow').forEach(attachDelete);

// פונקציה לבדיקה אם כתובת מייל חוקית
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// הצגת הודעת שגיאה עם אנימציה ושדה מרקיד
function showError(element, message) {
  const error = document.createElement('div');
  error.classList.add('error');
  error.textContent = message;
  element.parentNode.insertBefore(error, element.nextSibling);

  error.style.color = 'red';
  error.style.fontSize = '0.9em';
  error.style.marginTop = '5px';
  error.style.animation = 'fadeOut 3s forwards';
  setTimeout(() => error.remove(), 3000);

  element.classList.add('inputError');
  setTimeout(() => element.classList.remove('inputError'), 300);
}

// הצגת שם הקובץ שנבחר ושמירה על כפתור העלאה
attachmentInput.addEventListener('change', () => {
  const prevError = attachmentLabel.querySelector('.error');
  if (prevError) prevError.remove();

  if (attachmentInput.files.length > 0) {
    fileInfo.textContent = "קובץ נבחר: " + attachmentInput.files[0].name;
  } else {
    fileInfo.textContent = "";
  }
});

// איסוף הנתונים, בדיקות תקינות ושליחה ל-Localhost
const form = document.getElementById('mailForm');
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const subject = form.subject.value.trim();
  const body = form.body.value.trim();
  const recipients = Array.from(document.querySelectorAll('input[name="recipients[]"]'))
                          .map(i => i.value.trim());
  const attachment = attachmentInput.files[0];

  // נקה הודעות קודמות
  document.querySelectorAll('.error').forEach(el => el.remove());

  let valid = true;

  if (!subject) { showError(form.subject, "חובה למלא את נושא המייל"); valid = false; }
  if (!body) { showError(form.body, "חובה למלא את גוף ההודעה"); valid = false; }
  if (!attachment) { showError(fileInfo, "חובה להעלות קובץ מצורף"); valid = false; }

  recipients.forEach((email, i) => {
    if (!validateEmail(email)) { showError(document.querySelectorAll('input[name="recipients[]"]')[i], "כתובת מייל לא חוקית"); valid = false; }
  });

  if (!valid) return;

  // יצירת FormData לשליחה ל-Localhost
  const formData = new FormData();
  formData.append("subject", subject);
  formData.append("body", body);
  recipients.forEach(r => formData.append("recipients[]", r));
  if (attachment) formData.append("attachment", attachment);

  try {
    const response = await fetch("https://localhost:7159/Mail/sendMail", {
      method: "POST",
      body: formData
    });

    const result = await response.json();

    if (result.status === "success") {
      alert("טיוטות נוצרו בהצלחה!");
    } else {
      alert("שגיאה: " + result.message);
    }

  } catch (err) {
    alert("שגיאה בחיבור לרכיב המקומי: " + err.message);
  }
});
