// Invoice Management System - Complete JavaScript Functionality

// Global variables
let signaturePad = null;
let hasSignature = false;
let providerSignatureDataUrl = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initializeInvoice();
    setupEventListeners();
    loadSavedData();
    setupKeyboardShortcuts();
});

// Main initialization function
function initializeInvoice() {
    initSignaturePad();
    createProviderSignatureImage();
    setDefaultDate();
    updateCompanyDisplay();
    resizeCanvasForMobile();
}

// Initialize signature pad
function initSignaturePad() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas) return;
    
    // Set canvas dimensions based on container
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    if (containerWidth < 450) {
        canvas.width = Math.min(containerWidth - 40, 360);
        canvas.height = 120;
    } else {
        canvas.width = 400;
        canvas.height = 150;
    }
    
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5,
        onBegin: function() {
            const placeholder = document.getElementById('signaturePlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }
    });
}

// Create provider signature programmatically
function createProviderSignatureImage() {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    
    // Clear background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Style the signature
    ctx.fillStyle = '#0b3d0b';
    ctx.font = '48px "Brush Script MT", "Lucida Handwriting", cursive';
    ctx.textBaseline = 'middle';
    
    // Draw name
    const name = 'Cliff Okiko';
    const textWidth = ctx.measureText(name).width;
    ctx.fillText(name, (canvas.width - textWidth) / 2, canvas.height / 2 + 10);
    
    // Add decorative underline
    ctx.strokeStyle = 'rgba(11,61,11,0.7)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo((canvas.width - textWidth) / 2 + 10, canvas.height / 2 + 30);
    ctx.quadraticCurveTo(
        canvas.width / 2, 
        canvas.height / 2 + 50, 
        (canvas.width + textWidth) / 2 - 10, 
        canvas.height / 2 + 30
    );
    ctx.stroke();
    
    // Save as data URL
    providerSignatureDataUrl = canvas.toDataURL('image/png');
    
    // Display in provider signature area
    const img = document.getElementById('providerSignatureImg');
    if (img) {
        img.src = providerSignatureDataUrl;
        img.style.display = 'block';
    }
}

// Set default dates
function setDefaultDate() {
    const clientDateInput = document.getElementById('clientDate');
    if (clientDateInput) {
        clientDateInput.valueAsDate = new Date();
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Company name auto-update
    const companyInput = document.getElementById('clientCompany');
    if (companyInput) {
        companyInput.addEventListener('input', updateCompanyDisplay);
    }
    
    // Window resize handler
    window.addEventListener('resize', debounce(resizeCanvasForMobile, 250));
    window.addEventListener('orientationchange', () => {
        setTimeout(resizeCanvasForMobile, 200);
    });
}

// Update company display in signature section
function updateCompanyDisplay() {
    const companyInput = document.getElementById('clientCompany');
    const displayElement = document.getElementById('displayClientCompany');
    
    if (companyInput && displayElement) {
        displayElement.textContent = companyInput.value || 'Letrum Agencies';
    }
}

// Clear signature function
function clearSignature() {
    if (signaturePad) {
        signaturePad.clear();
        hasSignature = false;
        
        const clientImg = document.getElementById('clientSignatureImg');
        const placeholder = document.getElementById('signaturePlaceholder');
        
        if (clientImg) {
            clientImg.style.display = 'none';
        }
        if (placeholder) {
            placeholder.style.display = 'inline';
        }
        
        showStatus('Signature cleared', 'success');
    }
}

// Save signature function
function saveSignature() {
    if (!signaturePad || signaturePad.isEmpty()) {
        showStatus('Please provide a signature first', 'warning');
        return;
    }
    
    hasSignature = true;
    const signatureImage = signaturePad.toDataURL();
    
    // Display signature
    const clientImg = document.getElementById('clientSignatureImg');
    const placeholder = document.getElementById('signaturePlaceholder');
    
    if (clientImg) {
        clientImg.src = signatureImage;
        clientImg.style.display = 'block';
    }
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Save to localStorage
    saveDataToStorage();
    showStatus('Signature saved successfully!', 'success');
}

// Generate PDF function - Fixed for proper rendering
function generatePDF() {
    const clientCompany = document.getElementById('clientCompany').value || 'Client';
    
    showStatus('📄 Generating PDF... Please wait...', 'warning');
    
    // Get the original container
    const original = document.querySelector('.container');
    
    // Clone the container for PDF generation
    const clone = original.cloneNode(true);
    
    // Remove non-printable elements from clone
    const elementsToRemove = clone.querySelectorAll(
        '.no-print, .action-buttons, .signature-section-digital, .signature-controls, button'
    );
    elementsToRemove.forEach(el => el.remove());
    
    // Add signatures to clone if they exist
    if (providerSignatureDataUrl) {
        const provDisplay = clone.querySelector('#providerAuthDisplay');
        if (provDisplay) {
            const img = provDisplay.querySelector('#providerSignatureImg');
            if (img) {
                img.src = providerSignatureDataUrl;
                img.style.display = 'block';
                // Ensure image is visible
                img.style.opacity = '1';
                img.style.visibility = 'visible';
            }
        }
    }
    
    if (hasSignature && signaturePad) {
        const clientDisplay = clone.querySelector('#clientSignatureDisplay');
        if (clientDisplay) {
            const img = clientDisplay.querySelector('#clientSignatureImg');
            if (img) {
                img.src = signaturePad.toDataURL();
                img.style.display = 'block';
                // Ensure image is visible
                img.style.opacity = '1';
                img.style.visibility = 'visible';
            }
            const placeholder = clientDisplay.querySelector('#signaturePlaceholder');
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }
    }
    
    // Fix all editable fields to show values
    const editableFields = clone.querySelectorAll('.editable-field');
    editableFields.forEach(field => {
        field.style.border = 'none';
        field.style.borderBottom = '1px solid #333';
        field.style.background = 'transparent';
        field.setAttribute('readonly', 'readonly');
    });
    
    // Ensure all tables are visible
    const tables = clone.querySelectorAll('.cost-table');
    tables.forEach(table => {
        table.style.pageBreakInside = 'avoid';
    });
    
    // Fix positioning issues
    clone.style.margin = '0';
    clone.style.padding = '20px';
    clone.style.background = 'white';
    
    // PDF generation options - optimized
    const opt = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${clientCompany.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`,
        image: { 
            type: 'jpeg', 
            quality: 0.98 
        },
        html2canvas: { 
            scale: 2,
            useCORS: true,
            letterRendering: true,
            logging: false,
            scrollY: 0,
            scrollX: 0,
            backgroundColor: '#ffffff',
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight
        },
        jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
        },
        pagebreak: { 
            mode: ['avoid-all', 'css', 'legacy'] 
        }
    };
    
    // Create a temporary container for PDF
    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.top = '0';
    pdfContainer.style.width = '210mm';
    pdfContainer.style.background = 'white';
    pdfContainer.appendChild(clone);
    document.body.appendChild(pdfContainer);
    
    // Wait for images to load
    setTimeout(() => {
        html2pdf()
            .set(opt)
            .from(clone)
            .save()
            .then(() => {
                showStatus('✅ PDF downloaded successfully!', 'success');
                // Clean up
                document.body.removeChild(pdfContainer);
            })
            .catch((err) => {
                showStatus('❌ Error generating PDF. Please try again.', 'error');
                console.error('PDF generation error:', err);
                // Clean up on error
                if (pdfContainer.parentNode) {
                    document.body.removeChild(pdfContainer);
                }
            });
    }, 500);
}

// Print invoice function
function printInvoice() {
    if (!hasSignature) {
        showStatus('⚠️ Please add your digital signature before printing', 'warning');
        return;
    }
    
    showStatus('🖨️ Opening print dialog...', 'success');
    window.print();
}

// Main download and email function
function downloadAndEmail() {
    // Validate required fields
    const validationResult = validateFields();
    if (!validationResult.isValid) {
        showStatus(validationResult.message, 'error');
        document.getElementById(validationResult.focusField).focus();
        return;
    }
    
    if (!hasSignature) {
        showStatus('⚠️ Please add your digital signature before proceeding', 'error');
        return;
    }
    
    showStatus('⚡ Generating your signed invoice PDF...', 'warning');
    
    // Generate PDF then open email
    generatePDF();
    
    // Wait a bit for PDF generation then open email
    setTimeout(() => {
        openEmailClient();
    }, 2000);
}

// Validate form fields
function validateFields() {
    const fields = {
        clientCompany: 'company name',
        clientEmail: 'email address',
        clientAddress: 'company address',
        clientPhone: 'phone number'
    };
    
    for (const [fieldId, fieldName] of Object.entries(fields)) {
        const value = document.getElementById(fieldId).value.trim();
        if (!value) {
            return {
                isValid: false,
                message: `⚠️ Please enter your ${fieldName}`,
                focusField: fieldId
            };
        }
    }
    
    // Validate email format
    const email = document.getElementById('clientEmail').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            message: '⚠️ Please enter a valid email address',
            focusField: 'clientEmail'
        };
    }
    
    return { isValid: true };
}

// Open email client with pre-filled content - FIXED ENCODING
function openEmailClient() {
    const clientCompany = document.getElementById('clientCompany').value;
    const clientEmail = document.getElementById('clientEmail').value;
    const clientAddress = document.getElementById('clientAddress').value;
    const clientPhone = document.getElementById('clientPhone').value;
    
    const recipients = 'cliff.okiko@gmail.com,muthaigasam222@gmail.com';
    const subject = `✅ SIGNED INVOICE - ${clientCompany} - Letrum Travel Platform Development`;
    const currentURL = window.location.href;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const bodyContent = `Dear Cliff Okiko,

I have completed and digitally signed the invoice for the Letrum Travel Platform development project.

📋 CLIENT DETAILS:
Company: ${clientCompany}
Email: ${clientEmail}
Address: ${clientAddress}
Phone: ${clientPhone}

📄 INVOICE DETAILS:
Invoice Number: KG-LTR-2025-001
Total Amount: KSH 180,000
Signed Date: ${new Date().toLocaleDateString()}

💰 PAYMENT SCHEDULE AGREED:
✅ 50% (KSH 90,000) - Upon contract signing - READY TO PAY
⏳ 30% (KSH 54,000) - Frontend completion demo
⏳ 20% (KSH 36,000) - Live deployment

📎 SIGNED INVOICE:
I have downloaded the signed PDF invoice and will attach it to this email.
Original Invoice Link: ${currentURL}
Reference ID: INV-${timestamp}

🚀 NEXT STEPS:
1. Invoice signed and attached
2. Ready to send KSH 90,000 deposit to 0792867928
3. Ready to begin 6-week development timeline
4. Excited to start this project!

📞 PAYMENT CONFIRMATION:
Our preferred payment method is MPESA to: 0792867928
Bank details available on request.

This invoice has been digitally signed and approved. Please proceed with the project as outlined.

Best regards,
${clientCompany}

---
📧 Auto-generated from signed invoice system
🔗 Original form: ${currentURL}
📅 Generated: ${new Date().toLocaleString()}`;
    
    // Properly encode for mailto - fixing the spaces issue
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(bodyContent);
    
    // Create mailto URL without replacing spaces with +
    const mailto = `mailto:${recipients}?subject=${encodedSubject}&body=${encodedBody}`;
    
    // Open email client
    window.location.href = mailto;
    
    showStatus('✅ Email opened! Please attach the downloaded PDF before sending.', 'success');
}

// Show status message
function showStatus(message, type = 'success') {
    const statusEl = document.getElementById('statusMessage');
    if (!statusEl) return;
    
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
    
    // Auto-hide after 4 seconds
    setTimeout(() => {
        statusEl.style.display = 'none';
    }, 4000);
}

// Save data to localStorage
function saveDataToStorage() {
    const data = {
        company: document.getElementById('clientCompany').value,
        address: document.getElementById('clientAddress').value,
        email: document.getElementById('clientEmail').value,
        phone: document.getElementById('clientPhone').value,
        date: document.getElementById('clientDate').value,
        signature: hasSignature && signaturePad ? signaturePad.toDataURL() : null,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('letrum_invoice_data', JSON.stringify(data));
}

// Load saved data from localStorage
function loadSavedData() {
    const savedData = localStorage.getItem('letrum_invoice_data');
    if (!savedData) return;
    
    try {
        const data = JSON.parse(savedData);
        
        // Fill form fields
        if (data.company) document.getElementById('clientCompany').value = data.company;
        if (data.address) document.getElementById('clientAddress').value = data.address;
        if (data.email) document.getElementById('clientEmail').value = data.email;
        if (data.phone) document.getElementById('clientPhone').value = data.phone;
        if (data.date) document.getElementById('clientDate').value = data.date;
        
        // Load signature if exists
        if (data.signature && signaturePad) {
            signaturePad.fromDataURL(data.signature);
            hasSignature = true;
            
            const clientImg = document.getElementById('clientSignatureImg');
            const placeholder = document.getElementById('signaturePlaceholder');
            
            if (clientImg) {
                clientImg.src = data.signature;
                clientImg.style.display = 'block';
            }
            if (placeholder) {
                placeholder.style.display = 'none';
            }
        }
        
        // Update company display
        updateCompanyDisplay();
        
        showStatus('Previous data loaded successfully!', 'success');
    } catch (err) {
        console.error('Error loading saved data:', err);
    }
}

// Reset form function
function resetForm() {
    if (!confirm('Are you sure you want to reset all fields? This will clear all entered data.')) {
        return;
    }
    
    // Clear all input fields
    document.getElementById('clientCompany').value = '';
    document.getElementById('clientAddress').value = '';
    document.getElementById('clientEmail').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('clientDate').valueAsDate = new Date();
    
    // Clear signature
    clearSignature();
    
    // Update display
    updateCompanyDisplay();
    
    // Clear saved data
    localStorage.removeItem('letrum_invoice_data');
    
    showStatus('Form reset successfully!', 'success');
}

// Resize canvas for mobile devices
function resizeCanvasForMobile() {
    const canvas = document.getElementById('signatureCanvas');
    if (!canvas || !signaturePad) return;
    
    const container = canvas.parentElement;
    const containerWidth = container.clientWidth;
    
    // Save signature data if exists
    const signatureData = hasSignature ? signaturePad.toDataURL() : null;
    
    // Resize canvas
    if (containerWidth < 450) {
        canvas.width = Math.min(containerWidth - 40, 360);
        canvas.height = 120;
    } else {
        canvas.width = 400;
        canvas.height = 150;
    }
    
    // Reinitialize signature pad
    signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)',
        minWidth: 1,
        maxWidth: 3,
        throttle: 16,
        minDistance: 5
    });
    
    // Restore signature if it existed
    if (signatureData && hasSignature) {
        signaturePad.fromDataURL(signatureData);
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'p':
                    e.preventDefault();
                    printInvoice();
                    break;
                case 's':
                    e.preventDefault();
                    saveDataToStorage();
                    showStatus('Data saved successfully!', 'success');
                    break;
                case 'r':
                    e.preventDefault();
                    resetForm();
                    break;
                case 'e':
                    e.preventDefault();
                    downloadAndEmail();
                    break;
            }
        }
    });
}

// Debounce utility function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save form data on input
document.addEventListener('input', debounce(function(e) {
    if (e.target.classList.contains('editable-field')) {
        saveDataToStorage();
    }
}, 1000));

// Handle visibility change to save state
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        saveDataToStorage();
    }
});

// Save before page unload
window.addEventListener('beforeunload', function() {
    saveDataToStorage();
});

// Expose functions to global scope for HTML onclick handlers
window.clearSignature = clearSignature;
window.saveSignature = saveSignature;
window.generatePDF = generatePDF;
window.printInvoice = printInvoice;
window.downloadAndEmail = downloadAndEmail;
window.resetForm = resetForm;