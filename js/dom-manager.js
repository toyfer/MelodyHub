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
            this.elements[id] = document.getElementById(id);
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
        return document.querySelector(selector);
    }

    /**
     * Queries the DOM for all elements matching a CSS selector.
     * @param {string} selector - CSS selector string
     * @returns {NodeList} A NodeList of matching elements
     */
    querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    /**
     * Creates a new DOM element with optional attributes.
     * @param {string} tagName - The HTML tag name for the element
     * @param {Object<string, any>} [attributes={}] - Object of attributes to set on the element
     * @returns {HTMLElement} The newly created element
     */
    createElement(tagName, attributes = {}) {
        const element = document.createElement(tagName);
        Object.keys(attributes).forEach(attr => {
            element[attr] = attributes[attr];
        });
        return element;
    }

    /**
     * Applies CSS styles to a DOM element.
     * @param {HTMLElement} element - The element to style
     * @param {Object<string, string>} styles - Object containing CSS property-value pairs
     */
    setStyle(element, styles) {
        if (element) {
            Object.assign(element.style, styles);
        }
    }
}

export default DOMManager;