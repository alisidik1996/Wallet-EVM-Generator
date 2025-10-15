(() => {
  const { ethers } = window;

  const countInput = document.getElementById('countInput');
  const mnemonicCheckbox = document.getElementById('mnemonicCheckbox');
  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const toggleMaskBtn = document.getElementById('toggleMaskBtn');
  const downloadCsvBtn = document.getElementById('downloadCsvBtn');
  const downloadJsonBtn = document.getElementById('downloadJsonBtn');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const progressEl = document.getElementById('progress');
  const tableBody = document.querySelector('#walletTable tbody');

  let wallets = [];
  let masked = true;
  let generating = false;

  const maskKey = key => masked ? key.slice(0,6) + '...' + key.slice(-4) : key;

  function updateProgress(value, total) {
    const percent = Math.floor((value / total) * 100);
    progressEl.style.width = percent + '%';
  }

  function renderTable() {
    tableBody.innerHTML = '';
    wallets.forEach((w, i) => {
      const tr = document.createElement('tr');

      const tdIdx = document.createElement('td');
      tdIdx.textContent = i + 1;

      const tdAddr = document.createElement('td');
      tdAddr.textContent = w.address;

      const tdPk = document.createElement('td');
      const pkDiv = document.createElement('div');
      pkDiv.className = 'pk';
      pkDiv.textContent = maskKey(w.privateKey);
      pkDiv.addEventListener('click', async () => {
        await navigator.clipboard.writeText(w.privateKey);
        pkDiv.style.opacity = '0.6';
        setTimeout(()=>pkDiv.style.opacity='1',300);
      });
      tdPk.appendChild(pkDiv);

      const tdMn = document.createElement('td');
      tdMn.textContent = w.mnemonic || '';

      const tdDel = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.className = 'delete-btn';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', () => {
        wallets.splice(i,1);
        renderTable();
      });
      tdDel.appendChild(delBtn);

      tr.append(tdIdx, tdAddr, tdPk, tdMn, tdDel);
      tableBody.appendChild(tr);
    });
  }

  async function generateWallets(count) {
    if (generating) return;
    generating = true;
    generateBtn.disabled = true;
    progressEl.style.width = '0%';
    const withMnemonic = mnemonicCheckbox.checked;
    const total = count;
    const batch = [];

    for (let i = 0; i < count; i++) {
      const w = ethers.Wallet.createRandom();
      batch.push({
        address: w.address,
        privateKey: w.privateKey,
        mnemonic: withMnemonic ? w.mnemonic.phrase : ''
      });
      if (i % 20 === 0) { // update UI setiap 20 wallet
        updateProgress(i, total);
        await new Promise(r => setTimeout(r, 1)); // beri waktu render
      }
    }

    wallets = wallets.concat(batch);
    updateProgress(total, total);
    renderTable();

    generating = false;
    generateBtn.disabled = false;
  }

  generateBtn.addEventListener('click', () => {
    const count = parseInt(countInput.value);
    if (!count || count < 1) return alert('Masukkan jumlah > 0');
    generateWallets(count);
  });

  clearBtn.addEventListener('click', () => {
    if (confirm('Hapus semua wallet dari tabel?')) {
      wallets = [];
      renderTable();
      progressEl.style.width = '0%';
    }
  });

  toggleMaskBtn.addEventListener('click', () => {
    masked = !masked;
    toggleMaskBtn.textContent = masked ? 'Unmask Private Keys' : 'Mask Private Keys';
    renderTable();
  });

  downloadCsvBtn.addEventListener('click', () => {
    if (!wallets.length) return alert('Belum ada data.');
    const header = ['index','address','privateKey','mnemonic'];
    const rows = wallets.map((w,i)=>[i+1,w.address,w.privateKey,w.mnemonic]);
    const csv = [header.join(','),...rows.map(r=>r.join(','))].join('\n');
    const blob = new Blob([csv],{type:'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallets_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });

  downloadJsonBtn.addEventListener('click', () => {
    if (!wallets.length) return alert('Belum ada data.');
    const blob = new Blob([JSON.stringify(wallets,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallets_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  copyAllBtn.addEventListener('click', async () => {
    if (!wallets.length) return alert('Belum ada data.');
    const txt = wallets.map((w,i)=>`${i+1}. ${w.address} | ${w.privateKey}`).join('\n');
    await navigator.clipboard.writeText(txt);
    alert('Semua address & private key telah disalin.');
  });

  renderTable();
})();
