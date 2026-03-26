export const pageStyles = `
    .ci-page {
        min-height: 100vh;
        background: var(--bg, #080f1e);
        font-family: 'Outfit', system-ui, sans-serif;
        color: var(--text, #e8f0fe);
    }

    /* Header */
    .ci-header {
        background: rgba(15,26,46,.95);
        border-bottom: 1px solid rgba(255,255,255,.07);
        padding: 0 24px;
    }
    .ci-header-inner {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px 0;
        display: flex;
        flex-direction: column;
        gap: 14px;
    }
    .ci-back { color: #4d6380; font-size: 13px; text-decoration: none; transition: color .15s; display: inline-block; }
    .ci-back:hover { color: #3b82f6; }
    .ci-header-title h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 4px; }
    .ci-header-title p  { font-size: 14px; color: #4d6380; }
    .ci-header-stats { display: flex; gap: 24px; }
    .ci-hstat { text-align: center; }
    .ci-hstat-val { display: block; font-size: 1.5rem; font-weight: 700; color: #3b82f6; }
    .ci-hstat-lbl { font-size: 11px; color: #4d6380; font-weight: 500; }

    /* Auth wall */
    .ci-auth-wall {
        max-width: 460px; margin: 80px auto; text-align: center;
        background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.08);
        border-radius: 20px; padding: 40px 32px;
    }
    .ci-auth-icon { font-size: 3rem; margin-bottom: 16px; }
    .ci-auth-wall h2 { font-size: 1.4rem; margin-bottom: 10px; }
    .ci-auth-wall p  { font-size: 14px; color: #4d6380; margin-bottom: 24px; }
    .ci-auth-btns { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

    /* Tabs */
    .ci-tabs-wrap {
        background: rgba(15,26,46,.7);
        border-bottom: 1px solid rgba(255,255,255,.06);
        padding: 0 24px;
        position: sticky; top: 60px; z-index: 50;
        backdrop-filter: blur(12px);
    }
    .ci-tabs { max-width: 1200px; margin: 0 auto; display: flex; gap: 4px; }
    .ci-tab {
        background: none; border: none; color: #4d6380; cursor: pointer;
        font-size: 14px; font-weight: 500; font-family: inherit;
        padding: 14px 20px; border-bottom: 2px solid transparent;
        transition: all .15s; display: flex; align-items: center; gap: 6px;
    }
    .ci-tab:hover { color: #8fa3c0; }
    .ci-tab.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .ci-tab-count {
        background: #3b82f6; color: #fff;
        border-radius: 10px; padding: 1px 7px; font-size: 10px; font-weight: 700;
    }

    /* Body */
    .ci-body { max-width: 1200px; margin: 0 auto; padding: 24px; }

    /* Sesizările mele */
    .ci-my-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .ci-my-header h2 { font-size: 1.1rem; font-weight: 600; }
    .ci-my-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
    .ci-issue-card {
        background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.07);
        border-radius: 14px; padding: 16px; cursor: pointer;
        transition: all .18s; display: flex; flex-direction: column; gap: 8px;
    }
    .ci-issue-card:hover { border-color: rgba(59,130,246,.4); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,.3); }
    .ci-ic-top { display: flex; justify-content: space-between; align-items: center; }
    .ci-ic-cat { font-size: 22px; }
    .ci-ic-title { font-size: 14px; font-weight: 600; line-height: 1.35; }
    .ci-ic-desc  { font-size: 12px; color: #4d6380; line-height: 1.55; flex: 1; }
    .ci-ic-meta  { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .ci-ic-cat-label {
        font-size: 10px; color: #4d6380; background: rgba(255,255,255,.05);
        border: 1px solid rgba(255,255,255,.07); border-radius: 8px; padding: 2px 7px; font-weight: 500;
    }
    .ci-ic-priority { font-size: 11px; font-weight: 500; }
    .ci-ic-date { font-size: 10px; color: #4d6380; margin-left: auto; }
    .ci-ic-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.05); }
    .ci-ic-actions { display: flex; gap: 6px; }

    /* Vote btn */
    .ci-vote-btn {
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
        color: #8fa3c0; padding: 5px 12px; border-radius: 7px;
        font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
        transition: all .15s;
    }
    .ci-vote-btn:hover { background: rgba(59,130,246,.12); color: #3b82f6; border-color: rgba(59,130,246,.35); }
    .ci-vote-btn.voted { background: rgba(59,130,246,.15); color: #3b82f6; border-color: rgba(59,130,246,.4); }

    .ci-vote-btn-lg {
        background: rgba(59,130,246,.1); border: 1px solid rgba(59,130,246,.25);
        color: #3b82f6; padding: 9px 20px; border-radius: 8px;
        font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
        transition: all .15s;
    }
    .ci-vote-btn-lg:hover { background: rgba(59,130,246,.2); }
    .ci-vote-btn-lg.voted { opacity: 0.7; cursor: default; }

    /* Action btns */
    .ci-action-btn {
        padding: 5px 10px; border-radius: 7px; font-size: 11px; font-weight: 500;
        cursor: pointer; border: 1px solid; transition: all .15s; font-family: inherit;
    }
    .ci-edit-btn   { background: rgba(59,130,246,.08); border-color: rgba(59,130,246,.25); color: #93c5fd; }
    .ci-edit-btn:hover { background: rgba(59,130,246,.16); }
    .ci-delete-btn { background: rgba(239,68,68,.08); border-color: rgba(239,68,68,.25); color: #fca5a5; }
    .ci-delete-btn:hover { background: rgba(239,68,68,.16); }

    /* Formular nou */
    .ci-new-section { max-width: 720px; margin: 0 auto; }
    .ci-stepper {
        display: flex; align-items: center; margin-bottom: 24px;
        background: rgba(15,26,46,.6); border: 1px solid rgba(255,255,255,.06);
        border-radius: 12px; padding: 14px 20px;
    }
    .ci-step { display: flex; align-items: center; gap: 8px; opacity: .4; transition: opacity .2s; }
    .ci-step.active { opacity: 1; }
    .ci-step.done .ci-step-num { background: #10b981; border-color: #10b981; }
    .ci-step-num {
        width: 28px; height: 28px; border-radius: 50%;
        background: rgba(59,130,246,.15); border: 1.5px solid rgba(59,130,246,.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 12px; font-weight: 700; color: #3b82f6; flex-shrink: 0;
    }
    .ci-step.active .ci-step-num { background: #3b82f6; color: #fff; border-color: #3b82f6; }
    .ci-step span { font-size: 13px; font-weight: 500; color: #8fa3c0; white-space: nowrap; }
    .ci-step-line { flex: 1; height: 1px; background: rgba(255,255,255,.08); margin: 0 12px; }

    .ci-card {
        background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px; padding: 24px;
    }
    .ci-card-header { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
    .ci-card-icon { font-size: 28px; flex-shrink: 0; }
    .ci-card-header h2 { font-size: 1.1rem; font-weight: 700; margin-bottom: 4px; }
    .ci-card-header p  { font-size: 13px; color: #4d6380; }

    .ci-map-pick { border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,.08); margin-bottom: 12px; }
    .ci-loc-confirm {
        background: rgba(16,185,129,.08); border: 1px solid rgba(16,185,129,.2);
        border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #6ee7b7;
        display: flex; justify-content: space-between; align-items: center;
        margin-bottom: 16px;
    }
    .ci-loc-hint {
        background: rgba(255,255,255,.04); border: 1px dashed rgba(255,255,255,.12);
        border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #4d6380;
        text-align: center; margin-bottom: 16px;
    }
    .ci-change-loc { background: none; border: none; color: #3b82f6; font-size: 12px; cursor: pointer; font-weight: 600; text-decoration: underline; font-family: inherit; }

    /* Form fields */
    .ci-form { display: flex; flex-direction: column; gap: 18px; }
    .ci-field { display: flex; flex-direction: column; gap: 6px; }
    .ci-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .ci-field label { font-size: 12px; font-weight: 600; color: #8fa3c0; text-transform: uppercase; letter-spacing: .5px; }
    .ci-req { color: #ef4444; }
    .ci-field input, .ci-field textarea, .ci-field select {
        width: 100%; padding: 11px 14px;
        background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08);
        border-radius: 9px; color: #e8f0fe; font-family: inherit; font-size: 14px;
        transition: border .2s; outline: none;
    }
    .ci-field input:focus, .ci-field textarea:focus, .ci-field select:focus { border-color: #3b82f6; background: rgba(59,130,246,.04); }
    .ci-field input::placeholder, .ci-field textarea::placeholder { color: #4d6380; }
    .ci-field textarea { resize: vertical; line-height: 1.6; }
    .ci-input-err { border-color: #ef4444 !important; }
    .ci-field-foot { display: flex; justify-content: space-between; align-items: center; min-height: 16px; }
    .ci-field-err { font-size: 11px; color: #fca5a5; }
    .ci-char-count { font-size: 11px; color: #4d6380; margin-left: auto; }
    .ci-err { background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #fca5a5; margin-bottom: 14px; }

    /* Categorie grid */
    .ci-cat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .ci-cat-btn {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px; padding: 10px 8px; text-align: center; cursor: pointer;
        transition: all .15s; font-family: inherit; display: flex; flex-direction: column;
        align-items: center; gap: 3px;
    }
    .ci-cat-btn:hover { border-color: rgba(59,130,246,.4); background: rgba(59,130,246,.06); transform: translateY(-1px); }
    .ci-cat-btn.active { border-color: #3b82f6; background: rgba(59,130,246,.12); }
    .ci-cat-icon { font-size: 18px; }
    .ci-cat-name { font-size: 11px; font-weight: 600; color: #8fa3c0; }
    .ci-cat-desc { font-size: 10px; color: #4d6380; line-height: 1.3; }

    /* Prioritate */
    .ci-priority-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .ci-prio-btn {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px; padding: 12px; cursor: pointer; text-align: left;
        font-family: inherit; transition: all .15s; display: flex; align-items: center; gap: 10px;
    }
    .ci-prio-btn:hover { border-color: rgba(var(--prio-color), .4); transform: translateY(-1px); }
    .ci-prio-btn.active { border-color: var(--prio-color); background: rgba(0,0,0,.15); box-shadow: 0 0 0 1px var(--prio-color) inset; }
    .ci-prio-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .ci-prio-name { font-size: 13px; font-weight: 600; color: #e8f0fe; }
    .ci-prio-desc { font-size: 10px; color: #4d6380; margin-top: 1px; }

    .ci-loc-preview {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #4d6380;
        display: flex; justify-content: space-between; align-items: center;
    }

    /* Preview box */
    .ci-preview-box {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        border-radius: 10px; overflow: hidden; margin-bottom: 14px;
    }
    .ci-preview-row {
        display: flex; gap: 14px; padding: 12px 16px;
        border-bottom: 1px solid rgba(255,255,255,.04);
    }
    .ci-preview-row:last-child { border-bottom: none; }
    .ci-preview-lbl { font-size: 12px; font-weight: 600; color: #4d6380; min-width: 80px; }
    .ci-preview-val { font-size: 13px; color: #e8f0fe; line-height: 1.5; }
    .ci-info-box {
        background: rgba(59,130,246,.07); border: 1px solid rgba(59,130,246,.18);
        border-radius: 8px; padding: 12px 14px; font-size: 13px; color: #93c5fd;
        display: flex; gap: 10px; align-items: flex-start; line-height: 1.55;
        margin-bottom: 14px;
    }

    /* Butoane */
    .ci-step-btns { display: flex; gap: 10px; justify-content: flex-end; padding-top: 6px; }
    .ci-btn-primary {
        background: #3b82f6; color: #fff; border: none; padding: 12px 24px;
        border-radius: 9px; font-size: 14px; font-weight: 600; cursor: pointer;
        transition: all .18s; font-family: inherit; display: inline-flex; align-items: center; gap: 7px;
        text-decoration: none;
    }
    .ci-btn-primary:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(59,130,246,.4); }
    .ci-btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .ci-btn-sm { padding: 8px 16px; font-size: 13px; }
    .ci-btn-secondary {
        background: transparent; color: #8fa3c0; border: 1px solid rgba(255,255,255,.12);
        padding: 12px 24px; border-radius: 9px; font-size: 14px; font-weight: 500;
        cursor: pointer; transition: all .18s; font-family: inherit; display: inline-flex; align-items: center; gap: 7px;
        text-decoration: none;
    }
    .ci-btn-secondary:hover { border-color: #3b82f6; color: #3b82f6; background: rgba(59,130,246,.06); }
    .ci-btn-danger {
        background: rgba(239,68,68,.15); color: #fca5a5; border: 1px solid rgba(239,68,68,.35);
        padding: 12px 24px; border-radius: 9px; font-size: 14px; font-weight: 600;
        cursor: pointer; transition: all .18s; font-family: inherit;
    }
    .ci-btn-danger:hover { background: rgba(239,68,68,.25); }
    .ci-submit-btn { min-width: 180px; justify-content: center; }
    .ci-spin {
        width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
        border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Badge */
    .ci-badge { display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 14px; font-size: 10px; font-weight: 600; white-space: nowrap; }
    .ci-badge-new      { background: rgba(239,68,68,.12);  color: #fca5a5; border: 1px solid rgba(239,68,68,.2); }
    .ci-badge-progress { background: rgba(245,158,11,.12); color: #fcd34d; border: 1px solid rgba(245,158,11,.2); }
    .ci-badge-done     { background: rgba(16,185,129,.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,.2); }
    .ci-badge-review   { background: rgba(59,130,246,.12); color: #93c5fd; border: 1px solid rgba(59,130,246,.2); }

    /* Hartă tab */
    .ci-map-section { display: flex; flex-direction: column; gap: 14px; }
    .ci-map-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    .ci-map-search-wrap { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 9px; padding: 0 12px; flex: 1; min-width: 200px; }
    .ci-map-search { background: none; border: none; color: #e8f0fe; font-size: 14px; font-family: inherit; padding: 10px 0; outline: none; width: 100%; }
    .ci-map-search::placeholder { color: #4d6380; }
    .ci-map-filters { display: flex; gap: 5px; flex-wrap: wrap; }
    .ci-map-filter-btn {
        background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07);
        color: #4d6380; padding: 7px 14px; border-radius: 20px;
        font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all .15s;
    }
    .ci-map-filter-btn:hover { color: #8fa3c0; border-color: rgba(255,255,255,.15); }
    .ci-map-filter-btn.active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
    .ci-map-count { font-size: 12px; color: #4d6380; white-space: nowrap; margin-left: auto; }

    .ci-map-layout { display: grid; grid-template-columns: 1fr 300px; gap: 14px; height: 580px; }
    .ci-map-container { position: relative; border-radius: 14px; overflow: hidden; border: 1px solid rgba(255,255,255,.07); }
    .ci-map-legend {
        position: absolute; bottom: 14px; left: 14px; z-index: 500;
        background: rgba(8,15,30,.9); border: 1px solid rgba(255,255,255,.08);
        border-radius: 10px; padding: 8px 12px; display: flex; gap: 12px; flex-wrap: wrap; backdrop-filter: blur(8px);
    }
    .ci-leg-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #4d6380; font-weight: 500; }
    .ci-leg-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }

    /* Sidebar hartă */
    .ci-map-sidebar { background: rgba(15,26,46,.8); border: 1px solid rgba(255,255,255,.07); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .ci-sidebar-header { padding: 12px 14px; border-bottom: 1px solid rgba(255,255,255,.06); font-size: 13px; font-weight: 600; flex-shrink: 0; }
    .ci-sidebar-list { overflow-y: auto; flex: 1; }
    .ci-sidebar-item { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,.04); cursor: pointer; transition: background .15s; }
    .ci-sidebar-item:hover { background: rgba(255,255,255,.03); }
    .ci-sidebar-item.active { background: rgba(59,130,246,.08); border-left: 2px solid #3b82f6; }
    .ci-si-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .ci-si-icon { font-size: 16px; }
    .ci-si-title { font-size: 12px; font-weight: 600; line-height: 1.35; margin-bottom: 5px; }
    .ci-si-meta { display: flex; justify-content: space-between; font-size: 10px; color: #4d6380; }

    /* Popup hartă (leaflet e în DOM alb) */
    .leaflet-popup-content-wrapper {
        background: linear-gradient(160deg, rgba(9,16,34,.97), rgba(18,36,64,.95)) !important;
        border: 1px solid rgba(96,165,250,.26) !important;
        border-radius: 16px !important;
        box-shadow: 0 18px 44px rgba(2,6,23,.55) !important;
        overflow: hidden;
    }
    .leaflet-popup-content { margin: 0 !important; }
    .leaflet-popup-tip {
        background: rgba(16,30,54,.95) !important;
        border: 1px solid rgba(96,165,250,.2) !important;
    }

    .ci-map-popup {
        padding: 14px;
        min-width: 230px;
        max-width: 260px;
        color: #e8f0fe;
        font-family: 'Outfit', sans-serif;
        background:
            radial-gradient(circle at 100% 0, rgba(59,130,246,.2), transparent 40%),
            radial-gradient(circle at 0 100%, rgba(168,85,247,.15), transparent 48%);
    }
    .ci-map-popup-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
    .ci-map-popup-icon {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        font-size: 18px;
        background: rgba(255,255,255,.08);
        border: 1px solid rgba(255,255,255,.15);
        flex-shrink: 0;
    }
    .ci-map-popup-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .ci-map-popup-category {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: .4px;
        color: #9fb6d9;
        font-weight: 600;
    }
    .ci-map-popup strong {
        display: block;
        color: #f8fbff;
        font-size: 14px;
        line-height: 1.35;
        margin-bottom: 6px;
        font-weight: 700;
    }
    .ci-map-popup p {
        color: #b7c7df;
        font-size: 12px;
        line-height: 1.6;
        margin-bottom: 10px;
    }
    .ci-map-popup-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-top: 1px solid rgba(255,255,255,.14);
        padding-top: 9px;
    }
    .ci-map-popup-votes { font-size: 12px; color: #9fb6d9; font-weight: 500; }
    .ci-map-popup-btn {
        border: 1px solid rgba(96,165,250,.36);
        background: rgba(59,130,246,.16);
        color: #dbeafe;
        padding: 5px 10px;
        border-radius: 999px;
        font-family: inherit;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .2px;
        cursor: pointer;
        transition: all .18s ease;
    }
    .ci-map-popup-btn:hover {
        background: rgba(59,130,246,.3);
        border-color: rgba(96,165,250,.6);
        transform: translateY(-1px);
    }

    /* Modal */
    .ci-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,.72);
        backdrop-filter: blur(6px); z-index: 200; display: flex;
        align-items: center; justify-content: center; padding: 20px;
        animation: ciOverlayIn .18s ease;
    }
    @keyframes ciOverlayIn { from { opacity: 0; } to { opacity: 1; } }
    .ci-modal {
        background: #0f1a2e; border: 1px solid rgba(255,255,255,.1);
        border-radius: 20px; width: 100%; max-width: 540px;
        max-height: 90vh; overflow-y: auto; box-shadow: 0 32px 80px rgba(0,0,0,.6);
        animation: ciModalIn .2s ease;
    }
    .ci-modal-lg { max-width: 680px; }
    @keyframes ciModalIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .ci-modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,.07); gap: 12px; }
    .ci-modal-title-wrap { display: flex; gap: 12px; align-items: flex-start; flex: 1; min-width: 0; }
    .ci-modal-cat-icon { font-size: 22px; width: 40px; height: 40px; background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .ci-modal-title { font-size: 15px; font-weight: 700; line-height: 1.3; }
    .ci-modal-sub   { font-size: 12px; color: #4d6380; margin-top: 3px; }
    .ci-modal-close { width: 30px; height: 30px; border-radius: 7px; border: 1px solid rgba(255,255,255,.08); background: transparent; color: #4d6380; cursor: pointer; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .15s; }
    .ci-modal-close:hover { background: rgba(255,255,255,.07); color: #e8f0fe; }
    .ci-modal-body { padding: 18px 20px; }
    .ci-modal-desc { font-size: 13px; color: #8fa3c0; line-height: 1.7; margin-bottom: 12px; }
    .ci-modal-priority { font-size: 12px; font-weight: 500; }
    .ci-modal-loc { background: rgba(255,255,255,.04); border-radius: 8px; padding: 9px 12px; font-size: 12px; color: #4d6380; display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; gap: 10px; }
    .ci-maps-link { color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 500; white-space: nowrap; }
    .ci-modal-date { font-size: 12px; color: #4d6380; margin-bottom: 12px; }
    .ci-admin-reply { background: rgba(59,130,246,.07); border-left: 3px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 12px 14px; margin-bottom: 12px; }
    .ci-reply-lbl { font-size: 10px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
    .ci-admin-reply p { font-size: 13px; color: #8fa3c0; line-height: 1.6; }
    .ci-modal-actions { display: flex; gap: 8px; flex-wrap: wrap; padding-top: 14px; border-top: 1px solid rgba(255,255,255,.05); margin-top: 14px; }
    .ci-modal-btn { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid; transition: all .15s; font-family: inherit; }

    /* Confirm delete */
    .ci-confirm-modal { background: #0f1a2e; border: 1px solid rgba(255,255,255,.1); border-radius: 16px; padding: 32px; max-width: 380px; width: 100%; text-align: center; box-shadow: 0 24px 64px rgba(0,0,0,.5); animation: ciModalIn .2s ease; }
    .ci-confirm-icon { font-size: 2.5rem; margin-bottom: 14px; }
    .ci-confirm-modal h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .ci-confirm-modal p { font-size: 13px; color: #4d6380; margin-bottom: 24px; line-height: 1.5; }
    .ci-confirm-btns { display: flex; gap: 10px; justify-content: center; }

    /* Toast */
    .ci-toast {
        position: fixed; bottom: 24px; right: 24px; padding: 12px 18px;
        border-radius: 10px; font-size: 13px; font-weight: 500; z-index: 9999;
        transform: translateY(16px); opacity: 0; pointer-events: none;
        transition: all .28s cubic-bezier(.175,.885,.32,1.275);
        display: flex; align-items: center; gap: 8px;
        min-width: 200px; max-width: 340px; backdrop-filter: blur(12px);
    }
    .ci-toast-info    { background: #0f1a2e; border: 1px solid rgba(255,255,255,.1); color: #e8f0fe; }
    .ci-toast-success { background: rgba(16,185,129,.12); border: 1px solid rgba(16,185,129,.3); color: #6ee7b7; }
    .ci-toast-error   { background: rgba(239,68,68,.12); border: 1px solid rgba(239,68,68,.3); color: #fca5a5; }
    .ci-toast-show { transform: translateY(0); opacity: 1; }

    /* Loading & Empty */
    .ci-loading { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 60px; color: #4d6380; }
    .ci-spinner { width: 36px; height: 36px; border: 3px solid rgba(59,130,246,.2); border-top-color: #3b82f6; border-radius: 50%; animation: spin .8s linear infinite; }
    .ci-empty { text-align: center; padding: 60px 24px; }
    .ci-empty-icon { font-size: 3rem; margin-bottom: 14px; }
    .ci-empty h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
    .ci-empty p { font-size: 13px; color: #4d6380; margin-bottom: 20px; }

    /* Leaflet popup reset */
    .leaflet-popup-content-wrapper { padding: 0 !important; border-radius: 10px !important; box-shadow: 0 8px 24px rgba(0,0,0,.3) !important; }
    .leaflet-popup-content { margin: 0 !important; }
    .leaflet-popup-tip-container { display: none !important; }
    .leaflet-control-attribution { display: none !important; }

    @media (max-width: 900px) {
        .ci-map-layout { grid-template-columns: 1fr; height: auto; }
        .ci-map-container { height: 400px; }
        .ci-map-sidebar { max-height: 250px; }
    }
    @media (max-width: 640px) {
        .ci-body { padding: 16px; }
        .ci-my-grid { grid-template-columns: 1fr; }
        .ci-cat-grid { grid-template-columns: repeat(2, 1fr); }
        .ci-priority-row { grid-template-columns: 1fr; }
        .ci-field-row { grid-template-columns: 1fr; }
        .ci-stepper { padding: 10px 12px; }
        .ci-step span { display: none; }
    }
`;
