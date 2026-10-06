/* =================================================================
   PORTFOLIO HOMEPAGE JAVASCRIPT
   -----------------------------------------------------------------
   This file is intentionally organized into small modules/functions.

   Current features:
   1. Toronto live clock
   2. Hero scroll fade + blur
   3. Scroll reveal animations
   4. Cursor image pop effect
   5. Current year in footer

   Everything is vanilla JavaScript.
   ================================================================= */


/* =================================================================
   GLOBAL CONFIGURATION
   -----------------------------------------------------------------
   Change these values to customize the behavior of the site.
   ================================================================= */

const SITE_CONFIG = {

    /* -------------------------------------------------------------
       CURSOR IMAGE TRAIL
       ------------------------------------------------------------- */

    cursorTrail: {

        /*
            Minimum number of milliseconds between images.

            LOWER value =
            more images appear.

            HIGHER value =
            fewer images appear.
        */
        appearanceRate: 180,


        /*
            How long an image remains animated on screen.

            Example:
            1200 = 1.2 seconds
        */
        duration: 1200,


        /*
            Maximum number of cursor images allowed on screen
            simultaneously.

            This prevents excessive DOM elements.
        */
        maxImages: 12,


        /*
            Random rotation range.

            Example:
            8 means images can rotate between -8deg and +8deg.
        */
        maxRotation: 8,


        /*
            Images that appear in the cursor trail.

            ------------------------------------------------------
            PLACE YOUR PERSONAL IMAGES HERE.
            ------------------------------------------------------

            Example:

            "images/me-01.jpg"
            "images/me-02.jpg"
            "images/me-03.jpg"

            You can add as many as you want.
        */
        images: [
            "images/me-01.jpg",
            "images/me-02.jpg",
            "images/me-03.jpg"
        ]
    },


    /* -------------------------------------------------------------
       HERO SCROLL EFFECT
       ------------------------------------------------------------- */

    hero: {

        /*
            Scroll distance over which the hero name disappears.

            800 = name fades considerably over first 800px.
        */
        fadeDistance: 800,


        /*
            Maximum blur applied to the hero name.
        */
        maxBlur: 14,


        /*
            Minimum opacity.

            0 means completely invisible.
        */
        minimumOpacity: 0,


        /*
            Slight scale-down while fading.
        */
        minimumScale: 0.96
    },


    /* -------------------------------------------------------------
       CLOCK
       ------------------------------------------------------------- */

    clock: {

        /*
            Toronto's official IANA time zone identifier.

            This automatically handles:
            - EST
            - EDT
            - Daylight Saving Time changes
        */
        timeZone: "America/Toronto"
    }
};


/* =================================================================
   UTILITY: CLAMP
   -----------------------------------------------------------------
   Restricts a number between a minimum and maximum.
   ================================================================= */

function clamp(value, min, max) {

    return Math.min(
        Math.max(value, min),
        max
    );
}


/* =================================================================
   TORONTO CLOCK
   ================================================================= */

function initializeTorontoClock() {

    const clockElement =
        document.getElementById("toronto-clock");


    /*
        Stop safely if the HTML element does not exist.
    */

    if (!clockElement) {
        return;
    }


    function updateClock() {

        const now = new Date();


        /*
            Intl.DateTimeFormat handles the timezone correctly.

            "America/Toronto" automatically switches between
            standard time and daylight time when appropriate.
        */

        const formattedTime =
            new Intl.DateTimeFormat(
                "en-CA",
                {
                    timeZone:
                        SITE_CONFIG.clock.timeZone,

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit",

                    hour12:
                        false
                }
            ).format(now);


        clockElement.textContent =
            formattedTime;
    }


    /*
        Run immediately so there is no empty clock on page load.
    */

    updateClock();


    /*
        Then update once per second.
    */

    setInterval(
        updateClock,
        1000
    );
}


/* =================================================================
   HERO SCROLL EFFECT
   -----------------------------------------------------------------
   The hero name itself remains physically centered.

   Instead of moving it vertically, we modify:
       opacity
       blur
       scale

   based on page scroll.
   ================================================================= */

function initializeHeroScrollEffect() {

    const hero =
        document.querySelector(".hero");


    const heroNameWrapper =
        document.querySelector(".hero-name-wrapper");


    if (!hero || !heroNameWrapper) {
        return;
    }


    /*
        Whether the user prefers reduced motion.
    */

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    if (reducedMotion) {
        return;
    }


    /*
        Prevent excessive animation work.

        Rather than changing CSS on every native scroll event,
        we use requestAnimationFrame.
    */

    let ticking = false;


    function updateHero() {

        const heroHeight =
            hero.offsetHeight;


        /*
            How far the page has scrolled.

            We use pageYOffset / scrollY because this effect
            is tied to the document's vertical scroll.
        */

        const scrollY =
            window.scrollY;


        /*
            Convert scrolling into a normalized 0 -> 1 value.
        */

        const progress =
            clamp(
                scrollY /
                SITE_CONFIG.hero.fadeDistance,

                0,
                1
            );


        /*
            Calculate opacity.
        */

        const opacity =
            1 -
            (
                progress *
                (1 - SITE_CONFIG.hero.minimumOpacity)
            );


        /*
            Calculate blur.
        */

        const blur =
            progress *
            SITE_CONFIG.hero.maxBlur;


        /*
            Calculate subtle scale.
        */

        const scale =
            1 -
            (
                progress *
                (1 - SITE_CONFIG.hero.minimumScale)
            );


        /*
            Write values to CSS custom properties.

            This keeps presentation logic inside CSS.
        */

        heroNameWrapper.style.setProperty(
            "--hero-opacity",
            opacity
        );


        heroNameWrapper.style.setProperty(
            "--hero-blur",
            `${blur}px`
        );


        heroNameWrapper.style.setProperty(
            "--hero-scale",
            scale
        );


        /*
            Important:
            The hero remains the full screen element.
            We're NOT changing its translateY position.
        */

        ticking = false;
    }


    window.addEventListener(
        "scroll",

        () => {

            if (!ticking) {

                window.requestAnimationFrame(
                    updateHero
                );

                ticking = true;
            }
        },

        { passive: true }
    );


    /*
        Run once on initialization.
    */

    updateHero();
}


/* =================================================================
   INTERSECTION OBSERVER
   -----------------------------------------------------------------
   Handles the fade / blur / movement reveal effect for sections.
   ================================================================= */

function initializeScrollReveals() {

    const revealElements =
        document.querySelectorAll(
            ".section-reveal"
        );


    if (!revealElements.length) {
        return;
    }


    /*
        Respect reduced-motion settings.
    */

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;


    /*
        With reduced motion enabled, simply reveal everything.
    */

    if (reducedMotion) {

        revealElements.forEach(
            element => {
                element.classList.add(
                    "is-visible"
                );
            }
        );

        return;
    }


    /*
        IntersectionObserver is more efficient than constantly
        checking window.scrollY.
    */

    const observer =
        new IntersectionObserver(

            (entries, observerInstance) => {

                entries.forEach(entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "is-visible"
                        );


                        /*
                            Once revealed, stop observing it.

                            This means the reveal happens once,
                            creating a cleaner portfolio experience.
                        */

                        observerInstance.unobserve(
                            entry.target
                        );
                    }
                });
            },

            {
                /*
                    Reveal slightly before the element reaches
                    the center of the screen.
                */

                threshold: 0.12,

                rootMargin:
                    "0px 0px -8% 0px"
            }
        );


    revealElements.forEach(
        element => {

            observer.observe(
                element
            );
        }
    );
}


/* =================================================================
   CURSOR IMAGE POP EFFECT
   ================================================================= */

function initializeCursorImageTrail() {

    const hero =
        document.querySelector(".hero");


    const layer =
        document.getElementById(
            "cursor-pop-layer"
        );


    if (!hero || !layer) {
        return;
    }


    /*
        Do not run the effect on devices without a normal pointer.

        This avoids awkward behavior on touch devices.
    */

    const hasFinePointer =
        window.matchMedia(
            "(pointer: fine)"
        ).matches;


    if (!hasFinePointer) {
        return;
    }


    /*
        Stop if there are no configured images.
    */

    if (
        !SITE_CONFIG.cursorTrail.images.length
    ) {
        return;
    }


    /*
        Keep track of:
        - when the last image appeared
        - current image index
    */

    let lastAppearanceTime = 0;
    let imageIndex = 0;


    /*
        Helper to determine which image should appear next.
    */

    function getNextImage() {

        const image =
            SITE_CONFIG.cursorTrail.images[
                imageIndex
            ];


        imageIndex =
            (
                imageIndex + 1
            ) %
            SITE_CONFIG.cursorTrail.images.length;


        return image;
    }


    /*
        Remove older images if there are too many.
    */

    function enforceImageLimit() {

        const images =
            layer.querySelectorAll(
                ".cursor-pop"
            );


        const excess =
            images.length -
            SITE_CONFIG.cursorTrail.maxImages;


        if (excess <= 0) {
            return;
        }


        /*
            Remove the oldest images first.
        */

        for (
            let i = 0;
            i < excess;
            i++
        ) {

            images[i].remove();
        }
    }


    /*
        Main mousemove handler.
    */

    hero.addEventListener(
        "mousemove",

        (event) => {

            const now =
                performance.now();


            /*
                Prevent a new image from appearing too frequently.
            */

            if (
                now -
                lastAppearanceTime <
                SITE_CONFIG.cursorTrail.appearanceRate
            ) {
                return;
            }


            lastAppearanceTime =
                now;


            /*
                Calculate cursor position relative to the hero.

                This is important because the pop layer is
                positioned inside the hero rather than the body.
            */

            const rect =
                hero.getBoundingClientRect();


            const x =
                event.clientX -
                rect.left;


            const y =
                event.clientY -
                rect.top;


            /*
                Create image element.
            */

            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "cursor-pop";


            image.src =
                getNextImage();


            /*
                We do not want these decorative images to create
                additional accessibility content.
            */

            image.alt =
                "";


            image.setAttribute(
                "aria-hidden",
                "true"
            );


            /*
                Position the image exactly where the cursor is.
            */

            image.style.left =
                `${x}px`;


            image.style.top =
                `${y}px`;


            /*
                Randomly rotate each image.

                Example:
                -5deg
                +3deg
                -8deg
            */

            const rotation =
                (
                    Math.random() *
                    SITE_CONFIG.cursorTrail.maxRotation * 2
                ) -
                SITE_CONFIG.cursorTrail.maxRotation;


            image.style.setProperty(
                "--random-rotation",
                `${rotation}deg`
            );


            /*
                CSS needs the duration as a variable.
            */

            image.style.setProperty(
                "--cursor-image-duration",
                `${SITE_CONFIG.cursorTrail.duration}ms`
            );


            /*
                Add the image to the DOM.
            */

            layer.appendChild(
                image
            );


            /*
                Keep the DOM lightweight.
            */

            enforceImageLimit();


            /*
                Remove the image after its animation completes.

                This keeps the effect fully self-cleaning.
            */

            image.addEventListener(
                "animationend",

                () => {
                    image.remove();
                },

                {
                    once: true
                }
            );
        }
    );
}


/* =================================================================
   CURRENT YEAR
   ================================================================= */

function initializeCurrentYear() {

    const yearElement =
        document.getElementById(
            "current-year"
        );


    if (!yearElement) {
        return;
    }


    yearElement.textContent =
        new Date().getFullYear();
}


/* =================================================================
   INITIALIZE EVERYTHING
   ================================================================= */

function initializePortfolio() {

    initializeTorontoClock();

    initializeHeroScrollEffect();

    initializeScrollReveals();

    initializeCursorImageTrail();

    initializeCurrentYear();
}


/*
    Wait for the HTML document to be ready.
*/

document.addEventListener(
    "DOMContentLoaded",
    initializePortfolio
);