export class ShareController {
    static copyShareUrl() {
        try {
            const config = window.config;
            const ra = ShareController.roundTo(config.viewState.centerRA, 3);
            const dec = ShareController.roundTo(config.viewState.centerDec, 3);
            const lat = ShareController.roundTo(config.observationSite.latitude, 3);
            const lon = ShareController.roundTo(config.observationSite.longitude, 3);
            const t = config.displayTime;
            const y = ShareController.pad(t.year, 4);
            const m = ShareController.pad(t.month, 2);
            const d = ShareController.pad(t.day, 2);
            const hh = ShareController.pad(t.hour, 2);
            const mm = ShareController.pad(t.minute, 2);
            const ss = ShareController.pad(t.second, 2);
            const time = `${y}${m}${d}-${hh}${mm}${ss}`;
            const fov = ShareController.roundTo(config.viewState.fieldOfViewRA, 2);
            const url = new URL(window.location.href);
            url.search = '';
            url.searchParams.set('ra', String(ra));
            url.searchParams.set('dec', String(dec));
            url.searchParams.set('lat', String(lat));
            url.searchParams.set('lon', String(lon));
            url.searchParams.set('time', time);
            url.searchParams.set('fov', String(fov));
            const shareUrl = url.toString();
            const onSuccess = () => {
                console.log('URL copied to clipboard');
                ShareController.showToast('コピーしました');
            };
            const onFail = () => {
                ShareController.fallbackCopy(shareUrl);
                ShareController.showToast('コピーしました');
            };
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(shareUrl).then(onSuccess).catch(onFail);
            }
            else {
                onFail();
            }
        }
        catch (e) {
            console.error('copyShareUrl error', e);
        }
    }
    // 
    static roundTo(value, digits) {
        const p = Math.pow(10, digits);
        return Math.round(value * p) / p;
    }
    static pad(n, width) {
        const s = String(Math.max(0, Math.floor(n)));
        return s.length >= width ? s : '0'.repeat(width - s.length) + s;
    }
    static fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
            document.execCommand('copy');
            console.log('URL copied to clipboard (fallback)');
        }
        catch (e) {
            console.error('fallback copy failed', e);
        }
        finally {
            document.body.removeChild(textarea);
        }
    }
    static showToast(message) {
        let toast = document.getElementById('copyToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'copyToast';
            toast.style.position = 'fixed';
            toast.style.zIndex = '20000';
            toast.style.left = '50%';
            toast.style.bottom = '20px';
            toast.style.transform = 'translateX(-50%)';
            toast.style.background = 'rgba(0,0,0,0.8)';
            toast.style.color = '#fff';
            toast.style.padding = '12px 15px';
            toast.style.borderRadius = '6px';
            toast.style.fontSize = '16px';
            toast.style.pointerEvents = 'none';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.display = 'block';
        setTimeout(() => {
            if (!toast)
                return;
            toast.style.transition = 'opacity 300ms';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast)
                    toast.style.display = 'none';
                toast?.style.removeProperty('transition');
            }, 350);
        }, 900);
    }
}
//# sourceMappingURL=ShareController.js.map