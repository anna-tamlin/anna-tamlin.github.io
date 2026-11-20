document.addEventListener("DOMContentLoaded", () => {
  if (!window.pdfjsLib) return;

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  document.querySelectorAll(".project-slideshow[data-pdf]").forEach(async (slideshow) => {
    const pdfUrl = slideshow.dataset.pdf;
    const canvas = slideshow.querySelector(".pdf-slide-canvas");
    const ctx = canvas.getContext("2d");
    const loading = slideshow.querySelector(".pdf-loading");
    const prevBtn = slideshow.querySelector(".slide-prev");
    const nextBtn = slideshow.querySelector(".slide-next");
    const counter = slideshow.querySelector(".slide-counter");

    let pdfDoc = null;
    let pageNum = 1;
    let isRendering = false;
    let pendingPage = null;

    function updateControls() {
      if (!pdfDoc) return;
      counter.textContent = `${pageNum} / ${pdfDoc.numPages}`;
      prevBtn.disabled = pageNum <= 1;
      nextBtn.disabled = pageNum >= pdfDoc.numPages;
    }

    async function renderPage(num) {
      isRendering = true;
      const page = await pdfDoc.getPage(num);

      const viewport = page.getViewport({ scale: 2 });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      loading?.classList.add("is-hidden");
      isRendering = false;

      if (pendingPage !== null) {
        const next = pendingPage;
        pendingPage = null;
        renderPage(next);
      }
    }

    function queuePage(num) {
      if (isRendering) {
        pendingPage = num;
      } else {
        renderPage(num);
      }
      updateControls();
    }

    try {
      pdfDoc = await pdfjsLib.getDocument(pdfUrl).promise;
      queuePage(pageNum);
    } catch (err) {
      if (loading) loading.textContent = "Could not load presentation.";
      console.error("PDF load error:", err);
    }

    prevBtn?.addEventListener("click", () => {
      if (pageNum <= 1) return;
      pageNum -= 1;
      queuePage(pageNum);
    });

    nextBtn?.addEventListener("click", () => {
      if (!pdfDoc || pageNum >= pdfDoc.numPages) return;
      pageNum += 1;
      queuePage(pageNum);
    });

    slideshow.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") prevBtn?.click();
      if (e.key === "ArrowRight") nextBtn?.click();
    });
  });
});