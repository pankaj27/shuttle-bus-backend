const fs = require("fs");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const moment = require("moment-timezone");
var path = require("path");

module.exports = {
  generatePDF: async (userDetail, templateName, res) => {
    let browser;
    try {
      console.log(`Generating PDF for ${templateName}...`);
      var fileDir = `./templates/${templateName}.html`;
      const filePath = path.join(__dirname, fileDir);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Template not found at ${filePath}`);
      }

      const source = fs.readFileSync(filePath, "utf-8").toString();
      const template = Handlebars.compile(source);
      const html = template(userDetail);

      browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--font-render-hinting=none",
        ],
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: "<span></span>",
        footerTemplate: `
          <div style="font-size: 10px; width: 100%; border-top: 1px solid #ccc; padding-top: 5px; margin: 0 10mm; display: flex; justify-content: space-between; font-family: Helvetica, Arial, sans-serif;">
            <span>Created at: ${moment().tz("Asia/Kolkata").format("LLL")}</span>
            <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
          </div>`,
        margin: {
          top: "15mm",
          bottom: "20mm",
          left: "10mm",
          right: "10mm",
        },
      });

      console.log(
        `PDF generated successfully, size: ${pdfBuffer.length} bytes`,
      );

      res.contentType("application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=invoice-${userDetail.pnr_no || "download"}.pdf`,
      );
      res.send(Buffer.from(pdfBuffer));
    } catch (err) {
      console.error("PDF Generation error:", err);
      if (res && !res.headersSent) {
        res.status(500).json({
          status: false,
          message: "Invoice generation failed",
          error: err.message,
        });
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
};
