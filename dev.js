// State
let currentPage = 1; // 1 means cover (Page 1) is visible on the right
let ytPlayer = null;
let ytReady = false;

function toggleClass(e, toggleClassName) {
  if (!e) return;
  if (e.classList) {
    e.classList.toggle(toggleClassName);
  } else if (e.className.includes(toggleClassName)) {
    e.className = e.className.replace(" " + toggleClassName, "").trim();
  } else {
    e.className += " " + toggleClassName;
  }
}

function updatePageInfo() {
  const infoEl = document.getElementById("navPageInfo");
  if (!infoEl) return;
  if (currentPage <= 1) {
    infoEl.innerText = "Cover Page";
  } else if (currentPage >= 9) {
    infoEl.innerText = "Proposal Page (DEV)";
  } else {
    infoEl.innerText = `Spread: Page ${currentPage - 1} & ${currentPage}`;
  }
}

function playYouTubeVideo() {
  if (window.ytPlayer && typeof window.ytPlayer.playVideo === "function") {
    try {
      window.ytPlayer.playVideo();
      return;
    } catch (err) {
      console.log("ytPlayer.playVideo error:", err);
    }
  }

  // Fallback: Send postMessage to YouTube iframe
  const iframe = document.getElementById("ytVideoPlayer");
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', "*");
  }
}

// Global callback required by YouTube IFrame API
window.onYouTubeIframeAPIReady = function () {
  try {
    window.ytPlayer = new YT.Player("ytVideoPlayer", {
      events: {
        onReady: function (event) {
          window.ytReady = true;
          // If already on page 3 or later, start playing immediately
          if (currentPage >= 3) {
            try {
              event.target.playVideo();
            } catch (e) {
              console.log("Autoplay on ready:", e);
            }
          }
        },
      },
    });
  } catch (e) {
    console.log("YT.Player init error:", e);
  }
};

function flipToPage(targetPage) {
  const pages = document.querySelectorAll(".book .page");
  if (!pages.length) return;

  if (targetPage < 1) targetPage = 1;
  if (targetPage > pages.length + 1) targetPage = pages.length + 1;

  pages.forEach((p, idx) => {
    const pageNum = idx + 1;
    if (pageNum < targetPage) {
      p.classList.add("left-side");
    } else {
      p.classList.remove("left-side");
    }
  });

  currentPage = targetPage;
  updatePageInfo();

  // If opening spread containing page 3, trigger YouTube playback
  if (currentPage >= 3) {
    playYouTubeVideo();
  }
}

function movePage(e, page) {
  const pages = Array.from(document.querySelectorAll(".book .page"));
  if (page === undefined || page === null) {
    page = pages.indexOf(e) + 1;
  }

  // Right-side (odd) page clicked -> Flip forward automatically
  // Left-side (even) page clicked -> Flip backward automatically
  if (page % 2 === 1) {
    flipToPage(page + 2);
  } else {
    flipToPage(page - 1);
  }
}

function nextPage() {
  const pages = document.querySelectorAll(".book .page");
  if (currentPage + 2 <= pages.length + 1) {
    flipToPage(currentPage + 2);
  }
}

function prevPage() {
  if (currentPage - 2 >= 1) {
    flipToPage(currentPage - 2);
  } else {
    flipToPage(1);
  }
}

// Expose globals for inline attributes
window.movePage = movePage;
window.nextPage = nextPage;
window.prevPage = prevPage;
window.toggleClass = toggleClass;
window.flipToPage = flipToPage;
window.playYouTubeVideo = playYouTubeVideo;

// Setup on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  updatePageInfo();

  // Ensure origin is in the iframe URL to prevent Error 153
  const iframe = document.getElementById("ytVideoPlayer");
  if (iframe) {
    try {
      const origin = window.location.origin;
      if (origin && !iframe.src.includes("origin=")) {
        const u = new URL(iframe.src);
        u.searchParams.set("origin", origin);
        u.searchParams.set("enablejsapi", "1");
        u.searchParams.set("playsinline", "1");
        iframe.src = u.toString();
      }
    } catch (err) {
      console.log("Iframe origin setup error:", err);
    }
  }

  // Attach click listener to ALL pages in the book so clicking any page flips automatically
  const pages = document.querySelectorAll(".book .page");
  pages.forEach((pageEl, idx) => {
    const pageNum = idx + 1;
    pageEl.addEventListener("click", function (e) {
      // Do not flip if clicking the button on page 7 or iframe itself
      if (
        e.target.id === "botao1" ||
        e.target.closest("#botao1") ||
        e.target.closest(".yt-bar-actions")
      ) {
        return;
      }
      movePage(this, pageNum);
    });
  });

  // Keyboard navigation (Arrow keys flip automatically)
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      nextPage();
    } else if (e.key === "ArrowLeft") {
      prevPage();
    }
  });
});
