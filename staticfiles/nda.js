// Initialize EmailJS only once
document.addEventListener("DOMContentLoaded", function () {
    emailjs.init("S2FLOGrgxsy57Sd22"); // Public Key
});

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

        // Send email with the generated PDF
        sendEmail(formData, pdfBase64);

    } catch (error) {
        console.error('❌ Error generating PDF:', error);
    }
}

// Convert Blob to Base64
async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]); // Remove "data:application/pdf;base64,"
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

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
