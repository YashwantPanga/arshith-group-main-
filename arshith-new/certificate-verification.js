
const certificates = {
  "AFI/INT/2026/AG165": {
    name: "Gujjala Harika",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },

  "AFI/INT/2026/AG166": {
    name: "Sunitha Annavaram",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG167": {
    name: "Karnam Akhila",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG168": {
    name: "Samuel Raj Regeti",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG169": {
    name: "Sri Vidya Lavanya Lanka",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG170": {
    name: "Teja Senapathi",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG171": {
    name: "Mosuri Samhitha",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG172": {
    name: "Adari Nithin",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
  
  "AFI/INT/2026/AG174": {
    name: "Sai kiran Rao Pippera",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "31 July 2026",
    endDate: "26 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },

  "AFI/INT/2026/AG175": {
    name: "Kakarla Sudha Rani",
    role: "Web Developer",
    duration: "3 Months",
    startDate: "21 July 2026",
    endDate: "21 October 2026",
    company: "Arshith Fresh India Pvt. Ltd."
  },
};

const form = document.getElementById("verifyForm");
const input = document.getElementById("certificateNumber");
const result = document.getElementById("result");
const resultContent = document.getElementById("resultContent");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const certificateNumber = input.value.trim().toUpperCase();
  const certificate = certificates[certificateNumber];

  result.classList.remove("hidden");

  if (!certificate) {
    resultContent.innerHTML = `
      <div class="status invalid">
        <i class="fa-solid fa-circle-xmark"></i>
        Certificate Not Found
      </div>

      <div class="message error">
        No matching certificate was found.
        Check the certificate number and try again.
      </div>
    `;

    return;
  }

  resultContent.innerHTML = `
    <div class="status verified">
      <i class="fa-solid fa-circle-check"></i>
      Certificate Record Found
    </div>

    <p class="issuer">
      Issued by ${escapeHTML(certificate.company)}
    </p>

    <div class="detail">
      <span>Intern name</span>
      <strong>${escapeHTML(certificate.name)}</strong>
    </div>

    <div class="detail">
      <span>Internship role</span>
      <strong>${escapeHTML(certificate.role)}</strong>
    </div>

    <div class="detail">
      <span>Duration</span>
      <strong>${escapeHTML(certificate.duration)}</strong>
    </div>

    <div class="detail">
      <span>Start date</span>
      <strong>${escapeHTML(certificate.startDate)}</strong>
    </div>

    <div class="detail">
      <span>End date</span>
      <strong>${escapeHTML(certificate.endDate)}</strong>
    </div>

    <div class="detail">
      <span>Certificate number</span>
      <strong>${escapeHTML(certificateNumber)}</strong>
    </div>

    <div class="message success">
      This certificate number matches a record in the
      sample verification list.
    </div>
  `;
});

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[character];
  });
}
