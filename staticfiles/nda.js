// Initialize EmailJS only once
document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("S2FLOGrgxsy57Sd22"); // Public Key
});

// Convert Blob to Base64
async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove "data:application/pdf;base64,"
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Convert Base64 to Blob
function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64); // Decode the Base64 string
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        const byteNumbers = new Array(slice.length);

        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
}

async function generatePDF() {
    const formData = {
        subject: document.getElementById("subject").value,
        address: document.getElementById("address").value,
        dateEs: document.getElementById("dateEs").value,
        companyName: document.getElementById("companyName").value,
        fullName: document.getElementById("fullName").value,
        title: document.getElementById("title").value,
        signatureDate: document.getElementById("signatureDate").value,
        partyB: document.getElementById("partyB").value,
        secondPartyEmail: document.getElementById("email").value
    };

    // Check if all fields are filled
    if (Object.values(formData).includes('')) {
        alert('Please fill in all fields before generating the PDF!');
        return;
    }

    try {
        // Load the existing PDF template
        const response = await fetch('/static/NDA.pdf');
        const existingPdfBytes = await response.arrayBuffer();

        const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
        const form = pdfDoc.getForm();

        // Fill the form fields
        form.getTextField('Insert Subject / Topic').setText(formData.subject);
        form.getTextField('Insert Address').setText(formData.address);
        form.getTextField('Insert Date_es_:date').setText(formData.dateEs);
        form.getTextField('Insert Your Company Name').setText(formData.companyName);
        form.getTextField('Insert Your First and Last Name').setText(formData.fullName);
        form.getTextField('Insert Your Title').setText(formData.title);
        form.getTextField('Insert Date of Signature').setText(formData.signatureDate);
        form.getTextField('Party B Signature').setText(formData.partyB);

        // Serialize and create a preview
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

        // Validate PDF Blob
        if (!(pdfBlob instanceof Blob)) {
            console.error("❌ pdfBlob is not a Blob!");
            return;
        }

        const pdfUrl = URL.createObjectURL(pdfBlob);
        document.getElementById("pdfPreview").innerHTML = `<iframe src="${pdfUrl}" width="100%" height="600px"></iframe>`;

        // Convert PDF Blob to Base64
        const pdfBase64 = await blobToBase64(pdfBlob);

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}
async function generateConsultingPDF() {
  const formData = {
    contractorName: document.getElementById("contractorName").value,
    contractorAddress: document.getElementById("contractorAddress").value,
    todayDate: document.getElementById("todayDate").value,
    hoursPerWeek: document.getElementById("hoursPerWeek").value,
    consultantInitials: document.getElementById("consultantInitials").value,
    schInitials: document.getElementById("schInitials").value,
    dateSigned: document.getElementById("dateSigned").value,
    agreedBy: document.getElementById("agreedBy").value,
    ein: document.getElementById("ein").value,
    printName: document.getElementById("printName").value,
    printTitle: document.getElementById("printTitle").value,
    formAddress: document.getElementById("formAddress").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    zip: document.getElementById("zip").value,
    country: document.getElementById("country").value,
    onBehalfOf: document.getElementById("onBehalfOf").value,
  };

  if (Object.values(formData).includes("")) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("/static/Consulting_Agreement.pdf"); // adjust path
    const pdfBytes = await response.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
    const form = pdfDoc.getForm();

    form.getTextField("Contractor Name").setText(formData.contractorName);
    form.getTextField("Contractor Address").setText(formData.contractorAddress);
    form.getTextField("Today's Date").setText(formData.todayDate);
    form.getTextField("Hours/Week").setText(formData.hoursPerWeek);
    form.getTextField("Consultant Initials").setText(formData.consultantInitials);
    form.getTextField("SCH Initials").setText(formData.schInitials);
    form.getTextField("Date Signed").setText(formData.dateSigned);
    form.getTextField("Agreed By").setText(formData.agreedBy);
    form.getTextField("EIN").setText(formData.ein);
    form.getTextField("Print Name").setText(formData.printName);
    form.getTextField("Print Title").setText(formData.printTitle);
    form.getTextField("Form Address").setText(formData.formAddress);
    form.getTextField("City").setText(formData.city);
    form.getTextField("State").setText(formData.state);
    form.getTextField("ZIP").setText(formData.zip);
    form.getTextField("Country").setText(formData.country);
    form.getTextField("On Behalf Of").setText(formData.onBehalfOf);

    const pdfBytesOutput = await pdfDoc.save();
    const blob = new Blob([pdfBytesOutput], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    document.getElementById("pdfPreview").innerHTML = `<iframe src="${url}" width="100%" height="600px"></iframe>`;

  } catch (error) {
    console.error("❌ Error generating Consulting PDF:", error);
  }
}


/*
// Correct the typo here by changing `aasync` to `async`
async function sendEmail(formData, pdfBase64) {
    try {
        // Prepare the email parameters object for the template
        const templateParams = {
            subject: formData.subject,
            fullName: formData.fullName,
            partyB: formData.partyB,
            from_email: "markmnashed@gmail.com", // From email address
            to_email: formData.secondPartyEmail, // Recipient email
            file: pdfBase64, // Send the base64 PDF data directly
            file_name: "NDA.pdf" // File name for the attachment
        };

        // Send the email with the PDF as an attachment
        const response = await emailjs.send("service_6lroool", "template_4gt5had", templateParams);

        if (response.status === 200) {
            console.log("✅ Email sent successfully!");
        } else {
            console.error("❌ Email sending failed:", response.text);
        }
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
}
*/



