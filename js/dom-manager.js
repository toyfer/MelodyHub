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
            'album-select',
            'song-list',
            'song-items',
            'audio-player',
            'audio',
            'now-playing',
            'error-message',
            'play-pause-btn',
            'volume-btn',
            'share-current-song',
            'current-time',
            'duration',
            'progress-bar',
            'progress-fill',
            'progress-handle',
            'volume-slider',
            'volume-fill',
            'volume-handle'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.warn(`DOM element with ID '${id}' not found`);
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
            console.error('Invalid selector provided to querySelector');
            return null;
        }
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.error('Error in querySelector:', error);
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
            console.error('Invalid selector provided to querySelectorAll');
            return document.querySelectorAll(''); // empty NodeList
        }
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.error('Error in querySelectorAll:', error);
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
            if (dangerousAttributes.includes(attr.toLowerCase())) {
                console.warn(`Skipping dangerous attribute: ${attr}`);
                return;
            }
            try {
                element.setAttribute(attr, attributes[attr]);
            } catch (error) {
                console.error(`Error setting attribute ${attr}:`, error);
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
}

export default DOMManager;