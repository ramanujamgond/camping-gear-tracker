# Barcode & QR Code Generation Guide

This document outlines how to generate unique codes for your camping gear, compares Barcodes vs. QR Codes, and provides a technical workflow for bulk generation using open-source tools.

## 1. Validation: Barcode vs. QR Code

You mentioned a preference for **Barcodes** to optimize space. Here is a technical comparison to validate that choice.

### Barcode (Code 128)
*   **Shape**: Rectangular (Long and short).
*   **Space Efficiency**: **Low** for alphanumeric data.
    *   *Example*: Encoding a UUID (`550e8400-e29b...`) results in a very long barcode that is difficult to scan on small items.
    *   *Optimization*: To keep barcodes small, you **MUST** use short IDs (e.g., `CG-001`, `CG-002`).
*   **Scannability**: Requires the camera to be aligned with the bars. Standard smartphone cameras sometimes struggle without specific zoom/focus, though dedicated apps handle them well.
*   **Durability**: If a vertical slice is damaged, it may become unreadable.

### QR Code
*   **Shape**: Square.
*   **Space Efficiency**: **High**.
    *   Can encode a full URL or UUID in a very small footprint (e.g., 1x1 cm).
*   **Scannability**: Omnidirectional (can scan from any angle). Excellent support in native camera apps (iOS/Android).
*   **Durability**: High error correction (up to 30%). Can be partially ripped or dirty and still scan.

### **Final Verdict: Use QR Codes**

We will proceed with **QR Codes** for this project.

**Why?**
1.  **Superior Space Efficiency**: A **12mm x 12mm QR Code** can hold a unique ID easily. A Barcode with the same data would be ~40mm wide, which is too long for small items like carabiners or flashlight caps.
2.  **Better Scannability**: You can scan a QR code from any angle (upside down, sideways). Barcodes require perfect horizontal alignment, which is frustrating in a camping environment.
3.  **Durability**: QR codes have built-in error correction. If a corner of the sticker rips or gets muddy, it will likely still scan. Barcodes fail if a single vertical line is damaged.

**Decision**: The system will generate and use **QR Codes**.

---

## 2. Recommended Open Source Tool: Zint

We will use **Zint Barcode Generator**, a free, open-source desktop tool that can generate thousands of QR codes in bulk without writing a single line of code.

**Download**: [Zint on GitHub](https://github.com/zint/zint) (Available for Windows, Linux, macOS)

### Bulk Generation Workflow (No Code Required)

1.  **Prepare Your List**:
    *   Open Excel or Notepad.
    *   Create a list of your unique IDs (e.g., `CG-0001` to `CG-0100`).
    *   Save this as a plain text file: `ids.txt`.

2.  **Import into Zint**:
    *   Open Zint.
    *   Click **"Batch"** button (top menu).
    *   Select **"QR Code"** as the Symbology.
    *   In the Batch window, choose "Input File" and select your `ids.txt`.

3.  **Configure Output**:
    *   Set the output folder.
    *   Set the file format (PNG is best for general use, EPS/SVG for professional printing).
    *   Click **"Generate"**.

Zint will instantly create individual image files for every ID in your list. You can then simply drag-and-drop these images into a Word doc or give the folder to your print shop.

### Why Zint?
*   **100% Free & Open Source**.
*   **No Coding**: purely visual interface.
*   **Bulk Actions**: Handles 1 or 10,000 codes easily.
*   **Professional Standards**: Creates high-resolution, print-ready files.

---

## 3. Printing Workflow

1.  **Buy Sticker Paper**: Purchase A4 sheets with pre-cut labels.
2.  **Layout**:
    *   Open Microsoft Word or a Label Maker software (like Avery Design & Print - free online).
    *   Select your label template (e.g., L7160).
    *   **Import Images**: Select the folder of QR codes Zint created. Most label software allows "Mail Merge" or "Bulk Import" of images.
3.  **Print**: Print the PDF/Doc on your sticker paper.
4.  **Stick**: Apply to your gear.

## 4. Summary for Offline Shop
If you prefer to go to a shop:
1.  **Generate the List**: Provide them a CSV file with the IDs: `CG-0001`, `CG-0002`, etc.
2.  **Specify Format**: Tell them "Code 128 Barcode" or "QR Code".
3.  **Size**: Specify the physical dimensions (e.g., "5cm x 2cm").
