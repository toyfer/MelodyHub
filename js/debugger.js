class DebugConsole {
    constructor() {
        this.container = document.createElement('div');
        this.container.id = 'debug-console';
        this.container.style.position = 'fixed';
        this.container.style.right = '0';
        this.container.style.bottom = '0';
        this.container.style.width = '360px';
        this.container.style.maxHeight = '50vh';
        this.container.style.overflow = 'auto';
        this.container.style.background = 'rgba(0,0,0,0.85)';
        this.container.style.color = '#cfcfcf';
        this.container.style.fontSize = '12px';
        this.container.style.fontFamily = 'monospace';
        this.container.style.zIndex = '9999';
        this.container.style.padding = '8px';
        this.container.style.boxSizing = 'border-box';
        this.container.style.borderTopLeftRadius = '6px';
        this.container.style.display = 'none';

        this.header = document.createElement('div');
        this.header.style.display = 'flex';
        this.header.style.justifyContent = 'space-between';
        this.header.style.alignItems = 'center';
        this.header.style.marginBottom = '6px';

        const title = document.createElement('div');
        title.textContent = 'Debug Console';
        title.style.fontWeight = 'bold';
        title.style.color = '#fff';

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '6px';

        this.clearBtn = document.createElement('button');
        this.clearBtn.textContent = 'Clear';
        this.clearBtn.style.fontSize = '11px';
        this.clearBtn.addEventListener('click', () => this.clear());

        this.closeBtn = document.createElement('button');
        this.closeBtn.textContent = 'Hide';
        this.closeBtn.style.fontSize = '11px';
        this.closeBtn.addEventListener('click', () => this.hide());

        controls.appendChild(this.clearBtn);
        controls.appendChild(this.closeBtn);
        this.header.appendChild(title);
        this.header.appendChild(controls);

        this.logList = document.createElement('div');

        this.container.appendChild(this.header);
        this.container.appendChild(this.logList);

        document.addEventListener('DOMContentLoaded', () => {
            document.body.appendChild(this.container);
        });

        // simple toggle button
        this.toggleBtn = document.createElement('button');
        this.toggleBtn.id = 'debug-toggle-btn';
        this.toggleBtn.textContent = 'Debug';
        this.toggleBtn.style.position = 'fixed';
        this.toggleBtn.style.right = '0';
        this.toggleBtn.style.bottom = '50%';
        this.toggleBtn.style.zIndex = '9999';
        this.toggleBtn.style.opacity = '0.7';
        this.toggleBtn.addEventListener('click', () => this.toggle());
        document.addEventListener('DOMContentLoaded', () => document.body.appendChild(this.toggleBtn));
    }

    _appendMessage(level, message, meta) {
        const time = new Date().toLocaleTimeString();
        const row = document.createElement('div');
        row.style.marginBottom = '4px';
        row.style.whiteSpace = 'pre-wrap';
        row.style.wordBreak = 'break-word';
        row.innerHTML = `<span style="color:#9a9;">[${time}]</span> <span style="color:#7cc">${level}</span> - ${this._escape(String(message))}`;
        if (meta) {
            try {
                const metaPre = document.createElement('div');
                metaPre.style.color = '#aaa';
                metaPre.style.fontSize = '11px';
                metaPre.textContent = JSON.stringify(meta, null, 2);
                row.appendChild(metaPre);
            } catch (e) {}
        }
        this.logList.appendChild(row);
        // auto-scroll
        this.container.scrollTop = this.container.scrollHeight;
    }

    _escape(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    log(message, meta) {
        this.show();
        this._appendMessage('LOG', message, meta);
        // also print to console
        console.log('[DEBUG]', message, meta || '');
    }
    info(message, meta) { this.show(); this._appendMessage('INFO', message, meta); console.info('[DEBUG]', message, meta || ''); }
    warn(message, meta) { this.show(); this._appendMessage('WARN', message, meta); console.warn('[DEBUG]', message, meta || ''); }
    error(message, meta) { this.show(); this._appendMessage('ERROR', message, meta); console.error('[DEBUG]', message, meta || ''); }

    clear() { this.logList.innerHTML = ''; }
    show() { this.container.style.display = 'block'; this.toggleBtn.style.display = 'none'; }
    hide() { this.container.style.display = 'none'; this.toggleBtn.style.display = 'block'; }
    toggle() { if (this.container.style.display === 'none') this.show(); else this.hide(); }
}

export default DebugConsole;
