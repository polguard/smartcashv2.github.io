let provider, signer, contract, usdt, userAddress;
let refData = [], earnData = [];

const rankNames = [
  "Bronze",    // Rank 1
  "Silver",    // Rank 2
  "Gold",      // Rank 3
  "Platinum",  // Rank 4
  "Diamond",   // Rank 5
  "Elite",     // Rank 6
  "Legend"     // Rank 7
];

const rankGradients = [
  "linear-gradient(90deg, #cd7f32, #a97142)",     // Bronze
  "linear-gradient(90deg, #c0c0c0, #d3d3d3)",     // Silver
  "linear-gradient(90deg, #ffd700, #ffcc00)",     // Gold
  "linear-gradient(90deg, #b3e5fc, #0288d1)",     // Platinum
  "linear-gradient(90deg, #a6f1ff, #007bff)",     // Diamond
  "linear-gradient(90deg, #aa00ff, #e040fb)",     // Elite
  "linear-gradient(90deg, #ff6b00, #ff4500)"      // Legend
];

const weeklySalaries = [25, 50, 100, 200, 350, 500, 1000]; // en USDT por rango del 1 al 7
const salaryInterval = 7 * 24 * 60 * 60; // 7 días en segundos

function shortenAddress(address) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function showMessage(type, text) {
  const box = document.getElementById("statusBox");
  if (!box) {
    alert(text);
    return;
  }
  box.className = type === "success" ? "status-box success" :
                  type === "error"   ? "status-box error" :
                  "status-box info";
  box.textContent = text;
  box.style.display = "block";
  setTimeout(() => box.style.display = "none", 5000);
}

function getReferrer() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref && ethers.utils.isAddress(ref) && ref.toLowerCase() !== userAddress.toLowerCase()) {
    return ref;
  }
  return ethers.constants.AddressZero;
}

async function registerUser() {
  const name = document.getElementById("usernameInput").value.trim();
  const uplineId = document.getElementById("uplineInput").value.trim();

  if (!name || !uplineId || isNaN(uplineId)) {
    return showMessage("error", "⚠️ Please enter a valid name and upline ID.");
  }

  try {
    const tx = await contract.setUsername(name, parseInt(uplineId));
    showMessage("info", "📝 Registering...");
    await tx.wait();
    showMessage("success", "✅ Registered successfully!");

    // After registration, load the dashboard
    await loadUserData();
    assignButtonEvents();
    showSection("dashboard");
  } catch (err) {
    console.error("❌ Registration failed:", err);
    showMessage("error", "❌ Could not complete registration.");
  }
}

window.onload = async () => {
  if (!window.ethereum) {
    showMessage("error", "🦊 Please install MetaMask to use SmartCash.");
    return;
  }

  try {
    // Conexión con MetaMask
    provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = provider.getSigner();
    userAddress = await signer.getAddress();
    console.log("🧾 Connected as:", userAddress);

    // Instanciación de contratos
    contract = new ethers.Contract(CONTRACT_ADDRESS, SmartCash_ABI, signer);
    usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);

    // Mostrar dirección
    const addrSpan = document.getElementById("userAddress");
    if (addrSpan) addrSpan.textContent = shortenAddress(userAddress);

    // Obtener ID de usuario
    let userId = 0;
    try {
      userId = await contract.userIds(userAddress);
      const userIdSpan = document.getElementById("userId");
      if (userIdSpan) userIdSpan.textContent = userId.toString();
    } catch (err) {
      console.error("❌ Failed to fetch user ID:", err);
      showMessage("error", "❌ Could not verify registration status.");
      return;
    }

const urlParams = new URLSearchParams(window.location.search);
const ref = urlParams.get("ref");
const uplineInput = document.getElementById("uplineInput");

if (uplineInput) {
  if (ref && !isNaN(ref)) {
    uplineInput.value = ref;
    uplineInput.disabled = true;
    uplineInput.placeholder = "Invited by partner #" + ref;
  } else {
    uplineInput.value = "1";
    uplineInput.disabled = false;
    uplineInput.placeholder = "Default sponsor (assigned automatically)";
  }
}
    // Si el usuario ya está registrado
    if (userId > 0) {
      showSection("dashboard");

      const investBtn = document.getElementById("investBtn");
      if (investBtn) investBtn.onclick = handleApproveAndInvest;

      const withdrawBtn = document.getElementById("withdrawBtn");
      if (withdrawBtn) withdrawBtn.onclick = withdraw;

      const reinvestBtn = document.getElementById("reinvestBtn");
      if (reinvestBtn) reinvestBtn.onclick = reinvest;

      const setUsernameBtn = document.getElementById("setUsernameBtn");
      if (setUsernameBtn) setUsernameBtn.onclick = setUsername;

      const investAmount = document.getElementById("investAmount");
      if (investAmount) investAmount.addEventListener("input", updateProfitCalculator);
  const warningElem = document.getElementById("salaryWarning");
if (warningElem) {
  console.log("✅ salaryWarning found");
  warningElem.textContent = "⚠️ Test warning visible after page load";
} else {
  console.warn("❌ salaryWarning element not found in DOM");
}
      await loadUserData();
      assignButtonEvents();
      await setupReferralTabs();
      await loadAccountSettings();
      await loadTeamStats();


    } else {
      console.log("⏳ Showing registration form");
      showSection("registration");
      const regBtn = document.getElementById("registerBtn");
      if (regBtn) regBtn.onclick = registerUser;
    }

    showMessage("success", "Connected successfully");
  } catch (err) {
    console.error("❌ Init error:", err);
    showMessage("error", "Failed to initialize app.");
  }
};


function copyRefLink() {
  const input = document.getElementById("refLinkInput");
  input.select();
  input.setSelectionRange(0, 99999); // For mobile devices
  navigator.clipboard.writeText(input.value).then(() => {
    showMessage("success", "🔗 Referral link copied!");
  });
}

function updateProfitCalculator() {
  const invested = parseFloat(document.getElementById("totalInvested").textContent);
  if (isNaN(invested)) return;

  const gananciaDiaria = invested * 0.05;
  const total100dias = invested * 5;

  document.getElementById("dailyProfit").textContent = gananciaDiaria.toFixed(2);
  document.getElementById("totalProfit").textContent = total100dias.toFixed(2);
}

async function handleApproveAndInvest() {
  try {
    const input = document.getElementById("investAmount").value;
    if (!input || parseFloat(input) < 10) return showMessage("error", "📉 Minimum investment: 10 USDT");

    const amount = ethers.utils.parseUnits(input, 18);
    const allowance = await usdt.allowance(userAddress, CONTRACT_ADDRESS);

    console.log("🎯 Investment amount:", input, "USDT");
    console.log("🔍 Current allowance:", allowance.toString());

    if (allowance.lt(amount)) {
      const approveTx = await usdt.approve(CONTRACT_ADDRESS, amount);
      showMessage("info", "📝 Approving USDT...");
      await approveTx.wait();
      showMessage("success", "✅ USDT successfully approved");
    }

    const ref = getReferrer();
    const investTx = await contract.invest(ref, amount);
    showMessage("info", "📤 Investing...");
    await investTx.wait();
    showMessage("success", "🎉 Investment successful");

    document.getElementById("investAmount").value = "";
    updateProfitCalculator();
    loadUserData();
  } catch (err) {
    console.error("❌ Error while investing:", err);
    showMessage("error", "❌ Investment failed");
  }
}

async function withdraw() {
  try {
    const tx = await contract.withdraw();
    showMessage("info", "💸 Withdrawing...");
    await tx.wait();
    showMessage("success", "✅ Withdrawal complete");
    loadUserData();
  } catch (err) {
    console.error("❌ Error while withdrawing:", err);
    showMessage("error", "❌ Withdrawal not available yet");
  }
}
async function reinvest() {
  try {
    const tx = await contract.reinvest();
    showMessage("info", "🔄 Reinvesting...");
    await tx.wait();
    showMessage("success", "✅ Reinvestment completed");
    loadUserData();
  } catch (err) {
    console.error("❌ Error during reinvestment:", err);
    showMessage("error", "❌ Reinvestment failed");
  }
}

async function setUsername() {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return showMessage("error", "✏️ Please enter a valid name");
  try {
    const tx = await contract.setUsername(name);
    showMessage("info", "🔧 Saving name...");
    await tx.wait();
    showMessage("success", "✅ Name saved");
    loadUserData();
  } catch (err) {
    console.error("❌ Error saving name:", err);
    showMessage("error", "❌ Could not save name");
  }
}
async function getRealTeamVolume(address) {
  let totalVolume = ethers.BigNumber.from("0");

  for (let level = 0; level < 10; level++) {
    try {
      const [refs, statuses] = await contract.getReferralListWithStatus(address, level);

      for (let i = 0; i < refs.length; i++) {
        if (statuses[i]) {
          const refInfo = await contract.getUserInfo(refs[i]);
          totalVolume = totalVolume.add(refInfo.totalInvested);
        }
      }
    } catch (err) {
      console.error(`Error fetching level ${level + 1} referrals`, err);
    }
  }

  return totalVolume;
}
async function loadUserData() {
  try {
    if (!userAddress || !ethers.utils.isAddress(userAddress)) {
      showMessage("error", "⚠️ Wallet address is invalid.");
      return;
    }

    document.getElementById("vipProgress").style.display = "block";

    const userInfo = await contract.getUserInfo(userAddress);
    const userRaw = await contract.users(userAddress);
    const checkpoint = userRaw.checkpoint?.toNumber?.() || 0;
    const dividends = await contract.getUserDividends(userAddress);
    const name = await contract.usernames(userAddress);

    document.getElementById("userName").textContent = name || "-";
    const addrElem = document.getElementById("userAddress");
    if (addrElem) {
      addrElem.textContent = shortenAddress(userAddress);
      addrElem.title = userAddress;
    }

    try {
      const userId = await contract.userIds(userAddress);
      const userIdSpan = document.getElementById("userId");
      if (userIdSpan) userIdSpan.textContent = userId.toString();

      const refInput = document.getElementById("refLinkInput");
      if (refInput && userId > 0) {
        const baseUrl = window.location.origin;
        refInput.value = `${baseUrl}?ref=${userId}`;
      }
    } catch (e) {}

    const cleanAvailable = dividends;
    const displayBalance = ethers.utils.formatUnits(cleanAvailable, 18);
    document.getElementById("availableBalance").textContent = parseFloat(displayBalance).toFixed(2);

    // ✅ Volumen real (10 niveles activos)
    const realTeamVolumeBN = await getRealTeamVolume(userAddress);
    const realTeamVolumeFloat = parseFloat(ethers.utils.formatUnits(realTeamVolumeBN, 18));
    const realTeamVolumeDisplay = realTeamVolumeFloat.toFixed(2);
    document.getElementById("teamVolume").textContent = realTeamVolumeDisplay;

    // 👤 Rango por inversión + referidos activos
    const rankThresholds = [2000, 10000, 30000, 60000, 120000, 250000, 500000];
    const refRequirements = [3, 6, 12, 20, 35, 60, 100];
    const rankNames = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Elite", "Legend"];
    const rankGradients = [
      "linear-gradient(90deg, #cd7f32, #a97142)",
      "linear-gradient(90deg, #c0c0c0, #d3d3d3)",
      "linear-gradient(90deg, #ffd700, #ffcc00)",
      "linear-gradient(90deg, #b3e5fc, #0288d1)",
      "linear-gradient(90deg, #a6f1ff, #007bff)",
      "linear-gradient(90deg, #aa00ff, #e040fb)",
      "linear-gradient(90deg, #ff6b00, #ff4500)"
    ];

    const activeRefs = userInfo.counts?.[0]?.toNumber?.() || 0;
    let index = -1;
    for (let i = 0; i < rankThresholds.length; i++) {
      if (realTeamVolumeFloat >= rankThresholds[i] && activeRefs >= refRequirements[i]) {
        index = i;
      }
    }

    const currentRankName = index >= 0 ? rankNames[index] : "Unranked";
    const currentRankColor = index >= 0 ? rankGradients[index] : "linear-gradient(90deg, #444, #222)";
    const rankLabel = index >= 0
      ? `You are ${currentRankName}`
      : "You haven't ranked yet – Invite 3 active friends and generate $2000 volume to reach Bronze!";

    // ✅ Progreso visual hacia el siguiente rango
    let progress = 0;
    let nextIndex = rankThresholds.length;
    for (let i = 0; i < rankThresholds.length; i++) {
      if (realTeamVolumeFloat < rankThresholds[i] || activeRefs < refRequirements[i]) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex < rankThresholds.length) {
      const targetVol = rankThresholds[nextIndex];
      progress = Math.min((realTeamVolumeFloat * 100) / targetVol, 100);
    } else {
      progress = 100;
    }

    const vipBar = document.getElementById("vipBar");
    if (vipBar) {
      vipBar.style.width = `${progress}%`;
      vipBar.style.background = currentRankColor;
    }

    const vipText = document.getElementById("vipProgressText");
    if (vipText) {
      let message = `${currentRankName} – ${progress.toFixed(2)}% toward next rank`;
      if (nextIndex < rankThresholds.length) {
        const nextRefReq = refRequirements[nextIndex];
        const missing = nextRefReq - activeRefs;
        if (missing > 0) {
          message += ` – You need ${missing} more active referral${missing > 1 ? "s" : ""} to rank up`;
        }
      }
      vipText.textContent = message;
    }

    const userRankSpan = document.getElementById("userRank");
    if (userRankSpan) userRankSpan.textContent = rankLabel;

    // 👤 Rango visual (no salario)
    const rankLevelElem = document.getElementById("rankLevel");
    if (rankLevelElem) {
      const rankLabel = index >= 0
        ? `${index + 1} (${rankNames[index]})`
        : "0 (Unranked)";
      rankLevelElem.textContent = rankLabel;
    }

    document.getElementById("totalInvested").textContent = parseFloat(ethers.utils.formatUnits(userInfo.totalInvested, 18)).toFixed(2);
    document.getElementById("totalWithdrawn").textContent = parseFloat(ethers.utils.formatUnits(userInfo.totalWithdrawn, 18)).toFixed(2);

    if (document.getElementById("totalSalary")) {
      const weeklySalary = index >= 0 ? weeklySalaries[index] : 0;
      document.getElementById("totalSalary").textContent = weeklySalary.toFixed(2);
    }

    document.getElementById("passiveEarnings").textContent = parseFloat(ethers.utils.formatUnits(dividends, 18)).toFixed(2);

    const investedAmount = parseFloat(ethers.utils.formatUnits(userInfo.totalInvested, 18));
    document.getElementById("dailyProfit").textContent = (investedAmount * 0.05).toFixed(2);
    document.getElementById("totalProfit").textContent = (investedAmount * 5).toFixed(2);

    // ⏰ Salario semanal
    const now = Math.floor(Date.now() / 1000);
    const baseTime = userInfo.deposits?.[0]?.start?.toNumber?.() || 0;
    const secondsPerWeek = salaryInterval;

    const salaryElem = document.getElementById("nextSalaryCountdown");
    const dateElem = document.getElementById("nextSalaryDate");
    const warningElem = document.getElementById("salaryWarning");

    if (baseTime === 0) {
      if (salaryElem) salaryElem.textContent = "⏳ Weekly salary not active yet.";
      if (dateElem) dateElem.textContent = "";
      if (warningElem) warningElem.textContent = "⚠️ You must reinvest once to activate your weekly salary countdown.";
    } else {
      const weeksSince = Math.floor((now - baseTime) / secondsPerWeek);
      const currentCycleStart = baseTime + weeksSince * secondsPerWeek;
      const nextSalaryAt = currentCycleStart + secondsPerWeek;
      const secondsLeft = Math.max(0, nextSalaryAt - now);

      if (secondsLeft === 0) {
        if (salaryElem) salaryElem.textContent = "🎉 Your weekly salary has been sent to your wallet.";
        if (dateElem) dateElem.textContent = `📅 Next expected payout: ${new Date(nextSalaryAt * 1000).toLocaleString()}`;
        if (warningElem) warningElem.textContent = "";
      } else {
        if (salaryElem && !window.salaryTimerStarted) {
          window.salaryTimerStarted = true;
          setInterval(() => updateCountdown(nextSalaryAt), 1000);
        }
        const dateStr = new Date(nextSalaryAt * 1000).toLocaleString();
        if (dateElem) dateElem.textContent = `🗓️ Next salary available on: ${dateStr}`;
        if (warningElem) warningElem.textContent = "";
      }
    }

    const totalRef = userInfo.earnings.reduce((acc, val) => acc.add(val), ethers.BigNumber.from(0));
    document.getElementById("totalReferral").textContent = parseFloat(ethers.utils.formatUnits(totalRef, 18)).toFixed(2);

    const totalRefs = userInfo.counts.reduce((acc, val) => acc + val.toNumber(), 0);
    document.getElementById("teamNetwork").textContent = totalRefs;

    const tbody = document.getElementById("depositsTable");
    tbody.innerHTML = "";
    userInfo.deposits.forEach(dep => {
      const amount = parseFloat(ethers.utils.formatUnits(dep.amount, 18)).toFixed(2);
      const date = new Date(Number(dep.start) * 1000).toLocaleString();
      tbody.innerHTML += `<tr><td>${amount}</td><td>${date}</td></tr>`;
    });

    showReferrals(userInfo.counts, userInfo.earnings);
    await loadReferralEvents();

    document.getElementById("setUsernameBtn")?.addEventListener("click", setUsername);
    showSection("dashboard");

  } catch (err) {
    console.error("❌ Error loading user data:", err);
    showMessage("error", "❌ Could not load user data.");
  }
}

function updateCountdown(nextSalaryAt) {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = Math.max(0, nextSalaryAt - now);
  const salaryElem = document.getElementById("nextSalaryCountdown");

  if (!salaryElem) return;

  if (secondsLeft === 0) {
    salaryElem.textContent = "✅ You can claim your weekly salary now.";
    return;
  }

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  salaryElem.textContent = `⏳ Next salary in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
}
function updateCountdown(nextSalaryAt) {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = Math.max(0, nextSalaryAt - now);
  const salaryElem = document.getElementById("nextSalaryCountdown");

  if (!salaryElem) return;

  if (secondsLeft === 0) {
    salaryElem.textContent = "✅ You can claim your weekly salary now.";
    return;
  }

  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const minutes = Math.floor((secondsLeft % 3600) / 60);
  const seconds = secondsLeft % 60;

  salaryElem.textContent = `⏳ Next salary in: ${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function assignButtonEvents() {
  const investBtn = document.getElementById("investBtn");
  const withdrawBtn = document.getElementById("withdrawBtn");
  const reinvestBtn = document.getElementById("reinvestBtn");

  if (investBtn) investBtn.onclick = handleApproveAndInvest;
  if (withdrawBtn) withdrawBtn.onclick = withdraw;
  if (reinvestBtn) reinvestBtn.onclick = reinvest;
}
async function loadTeamStats() {
  try {
    if (!contract || !userAddress) return;

    const userId = await contract.userIds(userAddress);
    if (!userId || userId.eq(0)) return;

    const userInfo = await contract.getUserInfo(userAddress);

    const counts = userInfo.counts ?? [];
    const earnings = userInfo.earnings ?? [];
    const referralTotal = userInfo.volume ?? ethers.BigNumber.from(0);

    const totalRefs = counts.reduce((acc, val) => acc + val.toNumber(), 0);
    document.getElementById("teamNetwork").textContent = totalRefs;

    document.getElementById("teamVolume").textContent =
      parseFloat(ethers.utils.formatUnits(referralTotal, 18)).toFixed(2);

    const totalReferralBonus = earnings.reduce((acc, val) => acc.add(val), ethers.BigNumber.from(0));
    document.getElementById("totalReferral").textContent =
      parseFloat(ethers.utils.formatUnits(totalReferralBonus, 18)).toFixed(2);

  } catch (err) {
    console.error("❌ Error loading team stats:", err);
    showMessage("error", "❌ Failed to load team information.");
  }
}


function setupReferralTabs() {
  const container = document.getElementById("referralTabs");
  for (let i = 0; i < 10; i++) {
    const btn = document.createElement("button");
    btn.textContent = `Level ${i + 1}`;
    btn.onclick = () => showReferralTable(i);
    btn.className = "primary-btn";
    container.appendChild(btn);
  }
}

function showReferrals(referrals, earnings) {
  refData = referrals.map(x => x.toString());
  earnData = earnings.map(x => ethers.utils.formatUnits(x, 18));
  showReferralTable(0);
}

function showSection(id) {
  const sections = document.querySelectorAll("section.card");
  sections.forEach(sec => sec.style.display = "none");

  const target = document.getElementById(id);
  if (!target) {
    console.warn(`⚠️ Section '${id}' not found in the DOM`);
    return;
  }

  target.style.display = "block";

  // Ocultar o mostrar navegación según la sección
  const nav = document.querySelector(".bottom-nav");
  if (nav) {
    nav.style.display = id === "registration" ? "none" : "flex";
  }
}

async function loadReferralEvents() {
  try {
    const events = await contract.getReferralEvents(userAddress);

    if (!events.length) {
      document.getElementById("referralList").textContent = "No referral activity found.";
      return;
    }

    let html = `<table class="ref-table"><thead><tr>
      <th>From</th><th>Level</th><th>Amount (USDT)</th><th>Date</th></tr></thead><tbody>`;

    events.forEach(e => {
      const from = e.from;
      const level = e.level;
      const amount = ethers.utils.formatUnits(e.amount, 18);
      const date = new Date(Number(e.timestamp) * 1000).toLocaleString();

      html += `<tr><td>${from}</td><td>${level}</td><td>${amount}</td><td>${date}</td></tr>`;
    });

    html += `</tbody></table>`;
    document.getElementById("referralList").innerHTML = html;

  } catch (err) {
    console.error("❌ Error loading referral events:", err);
    showMessage("error", "❌ Failed to load referral history.");
  }
}

async function loadReferralList(level) {
  try {
    const [addresses, statuses] = await contract.getReferralListWithStatus(userAddress, level);

    if (!addresses.length) {
      document.getElementById("referralList").innerHTML = `<p>No referrals at level ${level + 1}.</p>`;
      return;
    }

    let table = `
      <table class="ref-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Address</th>
            <th>Username</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
    `;

    for (let i = 0; i < addresses.length; i++) {
      const addr = addresses[i];
      const isActive = statuses[i];
      const name = await contract.usernames(addr);

      table += `
        <tr>
          <td>${i + 1}</td>
          <td>${addr.slice(0, 6)}...${addr.slice(-4)}</td>
          <td>${name || "-"}</td>
          <td>${isActive ? "✅ Active" : "❌ Inactive"}</td>
        </tr>
      `;
    }

    table += "</tbody></table>";
    document.getElementById("referralList").innerHTML = table;
  } catch (err) {
    console.error("Error loading referral list:", err);
    showMessage("error", "❌ Error loading referral list.");
  }
}

async function loadAccountSettings() {
  try {
    if (!contract || !userAddress) return;
        const cached = localStorage.getItem("cachedTotalInvested");
    if (cached) {
      const elem = document.getElementById("totalGlobalInvested");
      if (elem) elem.textContent = cached + "";
    }
    const cachedRefBonuses = localStorage.getItem("cachedTotalReferralBonuses");
if (cachedRefBonuses) {
  const elem = document.getElementById("totalGlobalRefBonuses");
  if (elem) elem.textContent = cachedRefBonuses + "";
}

    console.log("⚙️ Loading General data...");

    const walletSpan = document.getElementById("settingsUserWallet").textContent = shortenAddress(userAddress);
    if (walletSpan) walletSpan.textContent = userAddress;

    const userId = await contract.userIds(userAddress);
    const userIdSpan = document.getElementById("settingsUserId");
    if (userIdSpan) userIdSpan.textContent = userId?.toString() || "-";

    const totalUsers = await contract.lastUserId();
    const totalUsersSpan = document.getElementById("totalUsers");
    if (totalUsersSpan) totalUsersSpan.textContent = totalUsers.toString();

    let totalInvested = ethers.BigNumber.from("0");
    let totalSalaries = ethers.BigNumber.from("0");
    let totalReferralBonuses = ethers.BigNumber.from("0");

    for (let i = 1; i <= totalUsers; i++) {
      const addr = await contract.idToAddress(i);
      const info = await contract.getUserInfo(addr);
      totalInvested = totalInvested.add(info.totalInvested);
      totalSalaries = totalSalaries.add(info.totalSalaryEarned);

      const referralSum = info.earnings.reduce((acc, val) => acc.add(val), ethers.BigNumber.from(0));
      totalReferralBonuses = totalReferralBonuses.add(referralSum);
    }

    document.getElementById("totalGlobalInvested").innerText =
      parseFloat(ethers.utils.formatUnits(totalInvested, 18)).toFixed(2);
      localStorage.setItem("cachedTotalInvested", parseFloat(ethers.utils.formatUnits(totalInvested, 18)).toFixed(2));


    document.getElementById("totalGlobalSalaries").innerText =
      parseFloat(ethers.utils.formatUnits(totalSalaries, 18)).toFixed(2);
      

    document.getElementById("totalGlobalRefBonuses").innerText =
      parseFloat(ethers.utils.formatUnits(totalReferralBonuses, 18)).toFixed(2);
      localStorage.setItem("cachedTotalReferralBonuses", 
  parseFloat(ethers.utils.formatUnits(totalReferralBonuses, 18)).toFixed(2));

  } catch (err) {
    console.error("❌ Error loading General data", err);
  }
}

// Helper function if not already defined
function shortenAddress(addr) {
  if (!addr) return "-";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

async function fetchTotalInvestedForRefs(addresses) {
  const results = [];

  for (const addr of addresses) {
    try {
      const info = await contract.getUserInfo(addr);
      const invested = ethers.utils.formatUnits(info.totalInvested, 18);
      results.push({ address: addr, invested });
    } catch (err) {
      console.error(`Error loading data for ${addr}`, err);
      results.push({ address: addr, invested: "0.00" });
    }
  }

  return results;
}

async function showReferralTable(index) {
  try {
    const [refs, statuses] = await contract.getReferralListWithStatus(userAddress, index);
    const data = [];

    for (let i = 0; i < refs.length; i++) {
      const addr = refs[i];
      const active = statuses[i];
      let username = "-";
      let invested = "0.00";

      try {
        const info = await contract.getUserInfo(addr);
        invested = ethers.utils.formatUnits(info.totalInvested, 18);
        username = await contract.usernames(addr);
      } catch (e) {
        console.warn("Error loading user info for", addr);
      }

      data.push({
        index: i + 1,
        address: addr,
        username,
        invested,
        status: active ? "✅ Active" : "❌ Inactive"
      });
    }
let html = `<div class="table-wrapper"><table class="ref-table">
  <thead>
    <tr>
      <th>#</th>
      <th>Address</th>
      <th>Username</th>
      <th>Status</th>
      <th>Total Invested</th>
    </tr>
  </thead>
  <tbody>`;

data.forEach(row => {
  html += `<tr>
    <td>${row.index}</td>
    <td>${row.address.slice(0, 6)}...${row.address.slice(-4)}</td>
    <td>${row.username}</td>
    <td>${row.status}</td>
    <td>${row.invested} USDT</td>
  </tr>`;
});

html += `</tbody></table></div>
<style>
@media screen and (max-width: 600px) {
  .ref-table,
  .ref-table th,
  .ref-table td {
    font-size: 0.65rem !important;
    padding: 4px 4px !important;
  }
  .ref-table td, .ref-table th {
    word-break: break-word !important;
  }
}
</style>`;

    document.getElementById("referralList").innerHTML = html;
  } catch (err) {
    console.error("Error loading referral table:", err);
    document.getElementById("referralList").textContent = "❌ Failed to load referral data";
  }
}
