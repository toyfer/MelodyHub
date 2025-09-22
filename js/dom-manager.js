//@ts-check
/**
 * DOM Manager Module
 * Handles DOM element retrieval and basic operations
 */

/**
 * Manages DOM element caching and provides utility methods for DOM operations.
 * Caches frequently used elements for performance and provides safe access methods.
 */
class DOMManager {
    /**
     * Creates an instance of DOMManager.
     * Initializes element caching for all required DOM elements.
     */
    constructor() {
        /** @type {Object<string, HTMLElement>} Cached DOM elements by ID */
        this.elements = {};
        this.initElements();
    }

    /**
     * Initializes and caches all required DOM elements.
     * Elements are stored in the elements object for quick access.
     * @private
     */
    initElements() {
        const elementIds = [
            'album-buttons-container',
            'song-list',
            'song-items',
            'audio-player',
            'audio',
            'now-playing',
            'error-message',
            'play-pause-btn',
            'volume-btn',
            'share-current-song',
            'back-to-album',
            'current-time',
            'duration',
            'progress-bar',
            'progress-fill',
            'volume-slider',
            'volume-fill'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
            }
            this.elements[id] = element;
        });
    }

    /**
     * Retrieves a cached DOM element by its ID.
     * @param {string} id - The element ID to retrieve
     * @returns {HTMLElement|null} The cached element or null if not found
     */
    getElement(id) {
        return this.elements[id];
    }

    /**
     * Queries the DOM for a single element using a CSS selector.
     * @param {string} selector - CSS selector string
     * @returns {Element|null} The first matching element or null
     */
    querySelector(selector) {
        if (!selector || typeof selector !== 'string') {
            return null;
        }
        try {
            return document.querySelector(selector);
        } catch (error) {
            return null;
        }
    }

    /**
     * Queries the DOM for all elements matching a CSS selector.
     * @param {string} selector - CSS selector string
     * @returns {NodeList} A NodeList of matching elements
     */
    querySelectorAll(selector) {
        if (!selector || typeof selector !== 'string') {
            return document.querySelectorAll(''); // empty NodeList
        }
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            return document.querySelectorAll(''); // empty NodeList
        }
    }

    /**
     * Creates a new DOM element with optional attributes.
     * @param {string} tagName - The HTML tag name for the element
     * @param {Object<string, any>} [attributes={}] - Object of attributes to set on the element
     * @returns {HTMLElement} The newly created element
     */
    createElement(tagName, attributes = {}) {
        if (!tagName || typeof tagName !== 'string') {
            throw new Error('Invalid tagName provided to createElement');
        }
        const element = document.createElement(tagName);
        const dangerousAttributes = ['innerHTML', 'outerHTML', 'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout'];
        Object.keys(attributes).forEach(attr => {
            const lower = attr.toLowerCase();
            if (dangerousAttributes.includes(lower)) {
                return;
            }
            try {
                // Common property mappings
                if (lower === 'textcontent') {
                    element.textContent = attributes[attr];
                    return;
                }
                if (lower === 'classname' || lower === 'class') {
                    element.className = attributes[attr];
                    return;
                }
                if (lower === 'style') {
                    const val = attributes[attr];
                    if (typeof val === 'string') {
                        element.setAttribute('style', val);
                    } else if (typeof val === 'object' && val !== null) {
                        Object.keys(val).forEach(k => { element.style[k] = val[k]; });
                    }
                    return;
                }

                // Fallback to properties when possible (for known DOM props)
                if (attr in element) {
                    try { element[attr] = attributes[attr]; return; } catch (e) {}
                }

                // Last resort: set as attribute
                element.setAttribute(attr, attributes[attr]);
            } catch (error) {
            }
        });
        return element;
    }

    /**
     * Refreshes the cached DOM elements.
     * Useful when the DOM has been dynamically updated.
     */
    refreshElements() {
        this.initElements();
    }

    /**
     * Sets multiple CSS styles on an element.
     * @param {HTMLElement} element - The element to style
     * @param {Object<string, string>} styles - Object of style properties and values
     */
    setStyle(element, styles) {
        if (!element || typeof styles !== 'object') return;
        Object.keys(styles).forEach(key => {
            element.style[key] = styles[key];
        });
    }
}

export default DOMManager;