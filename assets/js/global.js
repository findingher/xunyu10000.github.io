/**
 * 密室解密游戏 - 全局公共方法库
 * 版本: 1.0
 * 说明: 所有页面通过 window.GameAPI 调用，保持行为统一。
 */

(function() {
    'use strict';

    // ---------- 本地存储存档管理 ----------
    const STORAGE_KEY = 'mystery_game_save';

    const GameStorage = {
        // 获取全部存档
        getAll() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                console.warn('存档读取失败', e);
                return {};
            }
        },
        // 保存某个字段
        set(key, value) {
            const save = this.getAll();
            save[key] = value;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
        },
        // 获取某个字段
        get(key, defaultValue = null) {
            const save = this.getAll();
            return save.hasOwnProperty(key) ? save[key] : defaultValue;
        },
        // 重置所有存档
        reset() {
            localStorage.removeItem(STORAGE_KEY);
        },
        // 检查是否已完成某步骤
        hasCompleted(stepId) {
            return this.get(stepId, false) === true;
        }
    };

    // ---------- 全局音效（简易实现，无外部依赖）----------
    const AudioManager = {
        _ctx: null,
        _getContext() {
            if (!this._ctx) {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            return this._ctx;
        },
        // 播放一个简短的提示音（纯代码生成）
        playTone(freq = 800, duration = 0.15, type = 'sine') {
            try {
                const ctx = this._getContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                gain.gain.setValueAtTime(0.3, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + duration);
            } catch (e) { /* 静默处理 */ }
        },
        success() { this.playTone(880, 0.12); this.playTone(1100, 0.15); },
        error() { this.playTone(200, 0.3, 'square'); },
        click() { this.playTone(600, 0.08); }
    };

    // ---------- 页面跳转（带轻微过渡效果）----------
    function navigateTo(url, delay = 0) {
        setTimeout(() => {
            document.body.style.opacity = '0';
            document.body.style.transition = 'opacity 0.25s ease';
            setTimeout(() => {
                window.location.href = url;
            }, 250);
        }, delay);
    }

    // ---------- 弹窗系统 ----------
    function showModal({ title = '提示', content = '', confirmText = '确定', onConfirm = null, showCancel = false, cancelText = '取消' } = {}) {
        // 移除已有弹窗
        const existing = document.querySelector('.modal-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const cancelBtnHTML = showCancel ? `<button class="btn modal-cancel-btn" style="background:#b2bec3; margin-right:10px;">${cancelText}</button>` : '';
        
        overlay.innerHTML = `
            <div class="modal-box">
                <h3>${title}</h3>
                <p>${content}</p>
                <div style="display:flex; justify-content:center; gap:12px;">
                    ${cancelBtnHTML}
                    <button class="btn modal-confirm-btn">${confirmText}</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);

        const confirmBtn = overlay.querySelector('.modal-confirm-btn');
        const cancelBtn = overlay.querySelector('.modal-cancel-btn');

        const closeModal = () => {
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.2s';
            setTimeout(() => overlay.remove(), 200);
        };

        confirmBtn.addEventListener('click', () => {
            AudioManager.click();
            closeModal();
            if (typeof onConfirm === 'function') onConfirm();
        });

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                AudioManager.click();
                closeModal();
            });
        }

        // 点击遮罩关闭（可选）
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    // ---------- 轻提示 Toast ----------
    function showToast(message, type = 'info') {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (type === 'error') toast.style.background = '#d63031';
        else if (type === 'success') toast.style.background = '#00b894';
        
        document.body.appendChild(toast);
        setTimeout(() => {
            if (toast) toast.remove();
        }, 2500);
    }

    // ---------- 密码验证通用逻辑 ----------
    function setupPasswordInput(inputSelector, correctPassword, successCallback, errorCallback) {
        const input = document.querySelector(inputSelector);
        if (!input) return;
        
        // 支持回车触发
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const value = input.value.trim();
                if (value === correctPassword) {
                    AudioManager.success();
                    if (successCallback) successCallback();
                } else {
                    AudioManager.error();
                    showToast('密码错误，请重试', 'error');
                    if (errorCallback) errorCallback();
                    input.value = '';
                    input.focus();
                }
            }
        });

        // 可额外绑定按钮
        return {
            check: () => {
                const value = input.value.trim();
                if (value === correctPassword) {
                    AudioManager.success();
                    if (successCallback) successCallback();
                    return true;
                } else {
                    AudioManager.error();
                    showToast('密码错误，请重试', 'error');
                    input.value = '';
                    if (errorCallback) errorCallback();
                    return false;
                }
            }
        };
    }

    // ---------- 暴露全局 API ----------
    window.GameAPI = {
        storage: GameStorage,
        audio: AudioManager,
        navigateTo,
        showModal,
        showToast,
        setupPasswordInput,
    };

    console.log('✅ 密室游戏全局工具库已加载 (GameAPI)');
})();