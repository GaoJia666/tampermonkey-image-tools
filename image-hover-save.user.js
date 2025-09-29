// ==UserScript==
// @name         图片悬停放大 + 保存/复制链接 + toast
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  鼠标悬停图片放大，显示保存/复制链接按钮，保存直接下载，不跳转页面，复制显示toast
// @author       Jia Gao
// @match        *://*/*
// @grant        GM_setClipboard
// ==/UserScript==

(function() {
    'use strict';

    const scale = 1.5; // 放大倍数
    const duration = 0.2; // 放大动画时长（秒）

    // 创建toast
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.top = '10px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '10px 20px';
    toast.style.background = 'rgba(0,0,0,0.8)';
    toast.style.color = '#fff';
    toast.style.fontWeight = 'bold';
    toast.style.borderRadius = '8px';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    toast.style.zIndex = '99999';
    document.body.appendChild(toast);

    function showToast(msg) {
        toast.textContent = msg;
        toast.style.opacity = '1';
        clearTimeout(toast.timer);
        toast.timer = setTimeout(() => {
            toast.style.opacity = '0';
        }, 1500);
    }

    async function downloadImage(url) {
        try {
            const response = await fetch(url, {mode: 'cors'});
            const blob = await response.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = url.split('/').pop().split('?')[0] || 'image.jpg';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            showToast('图片已保存到本地');
        } catch (err) {
            console.error('下载图片失败:', err);
            showToast('图片保存失败');
        }
    }

    function addHoverEffect(img) {
        if (img.dataset.hoverAdded) return;
        img.dataset.hoverAdded = 'true';

        const btnContainer = document.createElement('div');
        btnContainer.style.position = 'fixed';
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '10px';
        btnContainer.style.padding = '6px 12px';
        btnContainer.style.background = 'rgba(0,0,0,0.8)';
        btnContainer.style.borderRadius = '8px';
        btnContainer.style.opacity = '0';
        btnContainer.style.transition = 'opacity 0.2s';
        btnContainer.style.pointerEvents = 'auto';
        btnContainer.style.zIndex = '99999';
        btnContainer.style.fontWeight = 'bold';
        btnContainer.style.color = '#fff';
        btnContainer.style.fontSize = '14px';
        btnContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';

        const saveBtn = document.createElement('span');
        saveBtn.textContent = '💾 保存';
        saveBtn.style.cursor = 'pointer';
        saveBtn.style.padding = '4px 10px';
        saveBtn.style.background = '#ff9800';
        saveBtn.style.borderRadius = '6px';
        saveBtn.style.userSelect = 'none';
        saveBtn.onmouseover = () => saveBtn.style.background = '#ffa733';
        saveBtn.onmouseleave = () => saveBtn.style.background = '#ff9800';

        const copyBtn = document.createElement('span');
        copyBtn.textContent = '🔗 复制链接';
        copyBtn.style.cursor = 'pointer';
        copyBtn.style.padding = '4px 10px';
        copyBtn.style.background = '#4caf50';
        copyBtn.style.borderRadius = '6px';
        copyBtn.style.userSelect = 'none';
        copyBtn.onmouseover = () => copyBtn.style.background = '#66bb6a';
        copyBtn.onmouseleave = () => copyBtn.style.background = '#4caf50';

        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(copyBtn);
        document.body.appendChild(btnContainer);

        let currentImgUrl = '';

        // 保存按钮点击下载
        saveBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (currentImgUrl) downloadImage(currentImgUrl);
        });

        // 复制链接
        copyBtn.addEventListener('click', e => {
            e.stopPropagation();
            if (currentImgUrl) {
                GM_setClipboard(currentImgUrl);
                showToast('图片链接已复制');
            }
        });

        // 悬停放大 + 按钮显示
        img.addEventListener('mouseenter', () => {
            currentImgUrl = img.src;
            img.style.transition = `transform ${duration}s`;
            img.style.transform = `scale(${scale})`;
            img.style.zIndex = '9999';
            img.style.position = 'relative';

            const rect = img.getBoundingClientRect();
            btnContainer.style.left = `${rect.right - btnContainer.offsetWidth}px`;
            btnContainer.style.top = `${rect.top}px`;
            btnContainer.style.opacity = '1';
        });

        img.addEventListener('mouseleave', () => {
            img.style.transform = 'scale(1)';
            btnContainer.style.opacity = '0';
        });

        // 鼠标进入按钮保持显示
        btnContainer.addEventListener('mouseenter', () => { btnContainer.style.opacity = '1'; });
        btnContainer.addEventListener('mouseleave', () => { btnContainer.style.opacity = '0'; });
    }

    document.querySelectorAll('img').forEach(addHoverEffect);

    // 动态图片支持
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            m.addedNodes.forEach(node => {
                if (node.tagName === 'IMG') addHoverEffect(node);
                else if (node.querySelectorAll) node.querySelectorAll('img').forEach(addHoverEffect);
            });
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

})();