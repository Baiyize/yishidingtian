/**
 * 一食定天 - 游戏主逻辑
 */

class Game {
  constructor() {
    this.currentScreen = 'hall';
    this.selectedDish = null;
    this.selectedCookingCharacter = null; // 佳肴精研选择的角色
    this.energy = 1500;
    this.baseEnergy = 1500; // 基础精力
    this.drill = 0;
    this.currentLevel = 1;
    this.ingredients = [];
    this.tools = [];
    this.color = 0;
    this.taste = 0;
    this.quality = 0;
    this.colorBonus = 0;
    this.tasteBonus = 0;
    this.qualityBonus = 0;
    this.discount = 0;
    this.skills = { skill1: 1, skill2: 1, skill3: 1, skill4: 1 };
    this.ingredientCounts = {};
    this.perfectIngredients = {};

    // 当前选择事件的食材类型（主食/配食）
    this.currentFoodEventType = null;

    // 账号系统
    this.currentAccount = null;
    this.accounts = {};

    // 图鉴系统 - 记录玩家获得过的食材和厨具
    this.discoveredIngredients = {};
    this.discoveredTools = {};

    // 美食进化追踪
    this.evolutionProgress = {};
    this.evolvedDishName = null;

    // 珍馐陈设装备数据
    this.equippedDishes = {}; // 槽位号 -> 美食数据

    this.minigameEncountered = false;
    this.musicPlaying = false;
    this.backgrounds = ['道具关卡背景.png', '水墨风背景.png'];
    this.currentBgIndex = 0;

    this.init();
  }

  init() {
    this.loadAllAccounts();
    this.initMusic();
    this.bindEvents();
    this.initArenaScreen();
    this.initNoticeSystem();
    this.initMailSystem();
    this.initBackpackSystem();
    this.initSummonSystem();
    this.initUnlockSlotSystem();
    this.initExchangeSystem();

    // 如果没有账号，显示登录
    if (!this.currentAccount) {
      document.getElementById('login-modal').classList.add('active');
      this.renderExistingAccounts();
    } else {
      // 检查每日登录奖励
      this.checkDailyLoginReward();
    }

    this.showScreen('hall');
  }

  // 初始化音乐
  initMusic() {
    const bgMusic = document.getElementById('bg-music');
    const musicBtn = document.getElementById('music-toggle');

    if (bgMusic) {
      bgMusic.volume = 0.5;
    }

    musicBtn.addEventListener('click', () => {
      if (this.musicPlaying) {
        bgMusic.pause();
        musicBtn.textContent = '🔇';
        musicBtn.classList.add('muted');
        this.musicPlaying = false;
      } else {
        bgMusic.play().catch(e => {
          console.log('音乐播放需要用户交互');
          alert('请点击页面后再开启音乐');
        });
        musicBtn.textContent = '🔊';
        musicBtn.classList.remove('muted');
        this.musicPlaying = true;
      }
    });
  }

  // 加载所有账号
  loadAllAccounts() {
    const saved = localStorage.getItem('yishidingtian_accounts');
    if (saved) {
      this.accounts = JSON.parse(saved);
    }

    // 版本1.3更新：检查版本号，如果旧版本则清除旧数据
    const version = localStorage.getItem('yishidingtian_version');
    if (!version || version !== '1.3') {
      // 清除旧版本数据
      localStorage.removeItem('yishidingtian_accounts');
      this.accounts = {};
      localStorage.setItem('yishidingtian_version', '1.3');
    }
  }

  // 保存所有账号
  saveAllAccounts() {
    localStorage.setItem('yishidingtian_accounts', JSON.stringify(this.accounts));
  }

  // 显示已有账号列表
  renderExistingAccounts() {
    const container = document.getElementById('existing-accounts');
    container.innerHTML = '';

    if (Object.keys(this.accounts).length > 0) {
      container.innerHTML = '<p style="color:#666;margin-bottom:10px;">已有账号（点击填入账号名）：</p>';
      Object.keys(this.accounts).forEach(name => {
        const btn = document.createElement('button');
        btn.className = 'account-item';
        btn.textContent = name;
        btn.addEventListener('click', () => {
          // 点击已有账号时，只填入账号名，需要用户输入密码
          document.getElementById('login-name').value = name;
          document.getElementById('login-password').focus();
        });
        container.appendChild(btn);
      });
    }
  }

  // 登录
  login(name) {
    if (!name) {
      name = document.getElementById('login-name').value.trim();
    }

    const password = document.getElementById('login-password').value;

    if (!name) {
      alert('请输入账号名称');
      return;
    }

    if (!password) {
      alert('请输入密码');
      return;
    }

    this.currentAccount = name;

    if (!this.accounts[name]) {
      // 新账号注册 - 版本1.3更新：新账号初始只有奥斯卡，宁荣荣需要抽卡获得
      this.accounts[name] = {
        password: password,
        drill: 0,
        skills: { skill1: 1, skill2: 1, skill3: 1, skill4: 1 },
        discoveredIngredients: {},
        discoveredTools: {},
        evolutionProgress: {},
        dishes: [],
        // 新账号初始只有奥斯卡（调整062167：宁荣荣需要抽取获得）
        characters: {
          oscar: {
            unlocked: true,
            friendship: 0,
            starStone: 0,
            constellations: CHARACTERS.oscar.constellations.map(c => ({ ...c, unlocked: false }))
          }
          // 注意：rongrong不在初始角色中，需要通过抽卡获得
        },
        items: {}, // 道具背包
        mails: JSON.parse(JSON.stringify(INITIAL_MAILS)), // 初始邮件
        equippedDishes: {},
        summonCounts: {},
        summonRecords: {},
        progressClaimed: {},
        unlockedSlots: [1, 2, 3] // 初始解锁前三个槽位
      };
      this.saveAllAccounts();
    } else {
      // 已有账号，验证密码
      if (this.accounts[name].password !== password) {
        alert('密码错误！');
        this.currentAccount = null;
        return;
      }
      // 检查并补发缺失的新邮件
      this.checkAndUpdateMails();
    }

    this.drill = this.accounts[name].drill;
    this.skills = { ...this.accounts[name].skills };
    this.discoveredIngredients = { ...this.accounts[name].discoveredIngredients };
    this.discoveredTools = { ...this.accounts[name].discoveredTools };
    this.evolutionProgress = { ...this.accounts[name].evolutionProgress };

    document.getElementById('login-modal').classList.remove('active');
    document.getElementById('account-name-display').textContent = name;
    this.updateDrillDisplay();

    // 检查每日登录奖励
    this.checkDailyLoginReward();

    this.saveCurrentAccount();
  }

  // 检查并补发缺失的新邮件
  checkAndUpdateMails() {
    if (!this.accounts[this.currentAccount].mails) {
      this.accounts[this.currentAccount].mails = [];
    }

    const existingMailIds = this.accounts[this.currentAccount].mails.map(m => m.id);

    // 检查INITIAL_MAILS中是否有新邮件需要添加
    INITIAL_MAILS.forEach(mail => {
      if (!existingMailIds.includes(mail.id)) {
        // 添加新邮件
        this.accounts[this.currentAccount].mails.push(JSON.parse(JSON.stringify(mail)));
        console.log(`补发新邮件: ${mail.title}`);
      }
    });

    this.saveAllAccounts();
  }

  // 切换账号
  switchAccount() {
    document.getElementById('login-modal').classList.add('active');
    document.getElementById('login-name').value = '';
    this.renderExistingAccounts();
  }

  // 退出账号
  logout() {
    if (confirm('确定要退出当前账号吗？')) {
      this.saveCurrentAccount();
      this.currentAccount = null;
      this.drill = 0;
      this.skills = { skill1: 1, skill2: 1, skill3: 1, skill4: 1 };
      document.getElementById('account-name-display').textContent = '未登录';
      document.getElementById('login-modal').classList.add('active');
      this.renderExistingAccounts();
    }
  }

  // 销毁账号
  deleteAccount() {
    if (confirm('确定要销毁账号吗？所有数据将永久删除！')) {
      delete this.accounts[this.currentAccount];
      this.saveAllAccounts();
      this.currentAccount = null;
      this.drill = 0;
      this.skills = { skill1: 1, skill2: 1, skill3: 1, skill4: 1 };
      document.getElementById('account-name-display').textContent = '未登录';
      document.getElementById('login-modal').classList.add('active');
      this.renderExistingAccounts();
    }
  }

  // 保存当前账号
  saveCurrentAccount() {
    if (this.currentAccount) {
      // 获取现有数据
      const existingData = this.accounts[this.currentAccount] || {};
      const existingPassword = existingData.password || '';
      const existingItems = existingData.items || {};
      const existingMails = existingData.mails || [];
      const existingCharacters = existingData.characters || {};
      const existingDishes = existingData.dishes || [];
      const existingEquipped = existingData.equippedDishes || {};
      const existingSummonCounts = existingData.summonCounts || {};
      const existingSummonRecords = existingData.summonRecords || {};
      const existingProgressClaimed = existingData.progressClaimed || {};
      const existingUnlockedSlots = existingData.unlockedSlots || [1, 2, 3];
      const existingLastLogin = existingData.lastLoginDate || '';

      // 合并所有数据
      this.accounts[this.currentAccount] = {
        password: existingPassword,
        drill: this.drill,
        skills: { ...this.skills },
        discoveredIngredients: { ...this.discoveredIngredients },
        discoveredTools: { ...this.discoveredTools },
        evolutionProgress: { ...this.evolutionProgress },
        dishes: existingDishes,
        equippedDishes: existingEquipped,
        characters: existingCharacters,  // 保持已解锁角色数据
        items: existingItems,  // 保持道具数据
        mails: existingMails,  // 保持邮件数据
        summonCounts: existingSummonCounts,  // 保持召唤次数
        summonRecords: existingSummonRecords,  // 保持召唤记录
        progressClaimed: existingProgressClaimed,  // 保持进度奖励领取状态
        unlockedSlots: existingUnlockedSlots,  // 保持解锁的槽位
        lastLoginDate: existingLastLogin  // 保持最后登录日期
      };
      this.saveAllAccounts();
    }
  }

  // 更新钻研显示
  updateDrillDisplay() {
    const el = document.getElementById('drill-value');
    if (el) el.textContent = this.drill;
  }

  // 绑定事件
  bindEvents() {
    // 登录
    document.getElementById('btn-login').addEventListener('click', () => this.login());

    // 账号操作
    document.getElementById('btn-switch-account').addEventListener('click', () => this.switchAccount());
    document.getElementById('btn-logout').addEventListener('click', () => this.logout());
    document.getElementById('btn-delete-account').addEventListener('click', () => this.deleteAccount());

    // 大厅按钮
    document.getElementById('btn-cooking').addEventListener('click', () => {
      // 显示选择角色界面
      this.showScreen('select-character');
      this.renderCookingCharacterSelect();
    });

    document.getElementById('btn-arena').addEventListener('click', () => {
      this.showScreen('arena');
    });

    document.getElementById('btn-collection').addEventListener('click', () => {
      this.showScreen('display');
      this.renderDisplayScreen();
    });

    document.getElementById('btn-training').addEventListener('click', () => {
      this.showScreen('training');
      this.renderTrainingScreen();
    });

    document.getElementById('alert-close').addEventListener('click', () => {
      document.getElementById('alert-modal').classList.remove('active');
    });

    // 选择角色界面返回
    document.getElementById('btn-back-select-char').addEventListener('click', () => {
      this.showScreen('hall');
    });

    // 确认选择角色
    document.getElementById('btn-confirm-char').addEventListener('click', () => {
      if (this.selectedCookingCharacter) {
        this.showScreen('select');
        this.renderFoodList();
        this.resetFoodDetail();
      } else {
        this.showAlert('请先选择一个角色！');
      }
    });

    // 返回按钮
    document.getElementById('btn-back-select').addEventListener('click', () => {
      this.showScreen('select-character');
      this.renderCookingCharacterSelect();
    });

    // 技能树
    document.getElementById('btn-skill-tree').addEventListener('click', () => {
      this.showScreen('skill');
      this.renderSkillTree();
    });

    document.getElementById('btn-back-skill').addEventListener('click', () => {
      this.showScreen('select');
    });

    // 版本1.3：邀约兑换按钮
    document.getElementById('btn-show-exchange').addEventListener('click', () => {
      this.showExchangeModal();
    });

    // 开始烹饪
    document.getElementById('btn-start-cook').addEventListener('click', () => {
      if (this.selectedDish) {
        this.startGame();
      } else {
        this.showAlert('请先选择一道美食！');
      }
    });

    // 详细信息按钮 - 显示图鉴
    document.getElementById('btn-food-info').addEventListener('click', () => {
      this.showCollectionModal();
    });

    // 关闭详细信息弹窗
    document.getElementById('food-info-close').addEventListener('click', () => {
      document.getElementById('food-info-modal').classList.remove('active');
    });

    // 美食战斗增益弹窗关闭
    document.getElementById('dish-bonus-close').addEventListener('click', () => {
      document.getElementById('dish-bonus-modal').classList.remove('active');
    });

    // 图鉴弹窗
    document.getElementById('collection-close').addEventListener('click', () => {
      document.getElementById('collection-modal').classList.remove('active');
    });

    document.getElementById('tab-ingredients').addEventListener('click', () => {
      document.getElementById('tab-ingredients').classList.add('active');
      document.getElementById('tab-tools').classList.remove('active');
      this.renderCollectionList('ingredients');
    });

    document.getElementById('tab-tools').addEventListener('click', () => {
      document.getElementById('tab-tools').classList.add('active');
      document.getElementById('tab-ingredients').classList.remove('active');
      this.renderCollectionList('tools');
    });

    // 图鉴详情弹窗关闭
    document.getElementById('collection-detail-close').addEventListener('click', () => {
      document.getElementById('collection-detail-modal').classList.remove('active');
    });

    // 退出游戏
    document.getElementById('btn-exit').addEventListener('click', () => {
      if (confirm('确定要退出游戏吗？')) {
        this.resetGame();
        this.showScreen('hall');
      }
    });

    // 结算
    document.getElementById('btn-settle').addEventListener('click', () => this.showResult());
    document.getElementById('btn-return-hall').addEventListener('click', () => {
      this.resetGame();
      this.showScreen('hall');
    });

    // 奖励确认
    document.getElementById('reward-confirm').addEventListener('click', () => {
      document.getElementById('reward-modal').classList.remove('active');
    });

    // 详情关闭
    document.getElementById('detail-close').addEventListener('click', () => {
      document.getElementById('item-detail-modal').classList.remove('active');
    });

    // 房间弹窗关闭
    document.getElementById('room-close').addEventListener('click', () => {
      document.getElementById('room-modal').classList.remove('active');
    });

    document.getElementById('btn-create-room').addEventListener('click', () => {
      this.createRoom();
    });

    document.getElementById('btn-join-room').addEventListener('click', () => {
      document.querySelector('.room-options').style.display = 'none';
      document.getElementById('join-input').style.display = 'block';
    });

    document.getElementById('btn-confirm-join').addEventListener('click', () => {
      const code = document.getElementById('input-room-code').value.trim();
      if (code) {
        this.joinRoom(code);
      }
    });

    // 珍馐陈设移除按钮
    document.getElementById('btn-remove-dish').addEventListener('click', () => {
      this.removeEquippedDish();
    });

    // 战斗状态详情弹窗关闭
    document.getElementById('battle-status-close').addEventListener('click', () => {
      document.getElementById('battle-status-detail-modal').classList.remove('active');
    });

    // 战斗美食详情弹窗关闭
    document.getElementById('battle-dish-close').addEventListener('click', () => {
      document.getElementById('battle-dish-detail-modal').classList.remove('active');
    });

    // 查看属性按钮
    document.getElementById('btn-view-stats').addEventListener('click', () => {
      this.showBattleStats();
    });

    // 战斗属性弹窗关闭
    document.getElementById('battle-stats-close').addEventListener('click', () => {
      document.getElementById('battle-stats-modal').classList.remove('active');
    });
  }

  // 显示战斗属性对比
  showBattleStats() {
    if (!this.battleState) return;

    // 计算当前加成后的属性
    const xiangyiBonus = this.battleState.xiangyiStacks * 0.13;
    // 品质评分每有100再提高5%
    let qualityBonus = 0;
    if (this.battleDishes.some(d => d.name.includes('流溢'))) {
      const qualityScore = this.battleDishes.find(d => d.name.includes('流溢'))?.quality || 0;
      qualityBonus = Math.floor(qualityScore / 100) * 0.05;
    }
    const currentAtk = Math.floor(this.battleState.playerAtk * (1 + xiangyiBonus + qualityBonus));

    // 计算非经典蛋包饭的生命值降低
    let hpReduction = 0;
    if (this.battleDishes.some(d => d.name.includes('非经典'))) {
      const tasteScore = this.battleDishes.find(d => d.name.includes('非经典'))?.taste || 0;
      hpReduction = 0.20 - (Math.floor(tasteScore / 100) * 0.03);
    }

    // 基础属性
    document.getElementById('base-stats-display').innerHTML = `
      <div><strong>生命值:</strong> ${this.battleState.baseHP}</div>
      <div><strong>攻击力:</strong> ${this.battleState.baseAtk}</div>
      <div><strong>暴击率:</strong> ${this.battleState.baseCritRate}%</div>
      <div><strong>暴击伤害:</strong> ${this.battleState.baseCritDmg}%</div>
      <div><strong>速度:</strong> ${this.battleState.playerSpeed.min}-${this.battleState.playerSpeed.max}</div>
    `;

    // 当前加成后属性
    let currentStatsHtml = `
      <div><strong>当前生命值:</strong> ${Math.floor(this.battleState.playerHP)} / ${Math.floor(this.battleState.playerMaxHP)}</div>
      <div><strong>当前攻击力:</strong> ${currentAtk}</div>
      <div><strong>暴击率:</strong> ${this.battleState.playerCritRate}%</div>
      <div><strong>暴击伤害:</strong> ${this.battleState.playerCritDmg}%</div>
    `;

    // 显示特殊状态层数
    if (this.battleState.xiangyiStacks > 0) {
      currentStatsHtml += `<div style="color:#f39c12;"><strong>香溢层数:</strong> ${this.battleState.xiangyiStacks}</div>`;
    }
    if (this.battleState.caiweiStacks > 0) {
      currentStatsHtml += `<div style="color:#f39c12;"><strong>彩味层数:</strong> ${this.battleState.caiweiStacks}</div>`;
    }
    if (this.battleState.jiangxinPoints > 0) {
      currentStatsHtml += `<div style="color:#f39c12;"><strong>匠心点数:</strong> ${this.battleState.jiangxinPoints}</div>`;
    }
    if (this.battleState.totalSoulConsumed > 0) {
      currentStatsHtml += `<div><strong>累计消耗魂力:</strong> ${this.battleState.totalSoulConsumed}</div>`;
    }

    document.getElementById('current-stats-display').innerHTML = currentStatsHtml;

    document.getElementById('battle-stats-modal').classList.add('active');
  }

  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
    this.currentScreen = screenId;
  }

  showAlert(text) {
    document.getElementById('alert-text').textContent = text;
    document.getElementById('alert-modal').classList.add('active');
  }

  // 渲染美食列表
  renderFoodList() {
    const list = document.getElementById('food-list');
    list.innerHTML = '';

    Object.values(DISHES).forEach(dish => {
      const item = document.createElement('div');
      item.className = 'food-item';
      // 添加放大镜按钮
      item.innerHTML = `
        <button class="magnifier-btn" title="查看战斗增益">🔍</button>
        <img src="assets/images/${dish.img}" class="food-item-img" alt="${dish.name}">
        <div class="food-item-info">
          <div class="food-item-name">${dish.name}</div>
          <div class="food-item-desc">${dish.desc}</div>
        </div>
      `;
      item.addEventListener('click', (e) => {
        // 如果点击的是放大镜按钮，显示战斗增益
        if (e.target.classList.contains('magnifier-btn')) {
          this.showDishBonusDetail(dish);
        } else {
          this.selectDish(dish);
        }
      });
      list.appendChild(item);
    });
  }

  // 渲染佳肴精研选择角色界面
  renderCookingCharacterSelect() {
    const charList = document.getElementById('select-char-list');
    charList.innerHTML = '';

    // 调整062110：只显示已解锁的角色
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};

    Object.values(CHARACTERS).forEach(char => {
      const isUnlocked = unlockedChars[char.id]?.unlocked || false;

      const card = document.createElement('div');
      card.className = `char-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <img src="assets/images/${char.avatar}" alt="${char.name}" style="${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.5;'}">
        <div class="char-card-name">${char.quality}<br>${char.name}</div>
        ${isUnlocked ? '' : '<div style="font-size:10px;color:#999;">未解锁</div>'}
      `;

      // 调整062110：只有解锁的角色才能点击选择
      if (isUnlocked) {
        card.addEventListener('click', () => this.selectCookingCharacter(char));
      } else {
        card.style.cursor = 'not-allowed';
        card.title = '该角色尚未解锁';
      }
      charList.appendChild(card);
    });

    // 默认显示提示（不显示图片）
    document.getElementById('select-char-img').style.display = 'none';
    document.getElementById('select-char-name').textContent = '请选择角色';
    document.getElementById('select-char-bonus').textContent = '';
    this.selectedCookingCharacter = null;
    document.querySelectorAll('#select-char-list .char-card').forEach(c => c.classList.remove('selected'));
  }

  // 选择佳肴精研角色
  selectCookingCharacter(char) {
    // 调整062110：检查角色是否已解锁
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};
    if (!unlockedChars[char.id]?.unlocked) {
      this.showAlert('该角色尚未解锁，无法使用！');
      return;
    }

    this.selectedCookingCharacter = char;

    document.querySelectorAll('#select-char-list .char-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    // 显示角色图片
    document.getElementById('select-char-img').style.display = 'block';
    document.getElementById('select-char-img').src = `assets/images/${char.chibi}`;
    document.getElementById('select-char-name').textContent = `${char.quality} ${char.name}`;
    document.getElementById('select-char-bonus').innerHTML = `<strong>佳肴精研天赋：</strong><br>${char.cookingBonus}`;
  }

  // 显示美食战斗增益详情
  showDishBonusDetail(dish) {
    const bonusData = DISH_BONUSES[dish.id];
    if (!bonusData) {
      this.showAlert('暂无战斗增益数据');
      return;
    }

    document.getElementById('dish-bonus-name').textContent = dish.name;
    document.getElementById('dish-bonus-img').src = `assets/images/${dish.img}`;

    // 显示本源效果
    let effectsHtml = `<div class="dish-bonus-effect-item"><strong>本源效果：</strong>${bonusData.effect}</div>`;

    // 显示进化分支效果
    if (bonusData.branches) {
      Object.values(bonusData.branches).forEach(branch => {
        effectsHtml += `<div class="dish-bonus-effect-item"><strong>${branch.name}：</strong>${branch.effect}</div>`;
      });
    }

    document.getElementById('dish-bonus-effects').innerHTML = `<h4>战斗增益效果</h4>${effectsHtml}`;
    document.getElementById('dish-bonus-modal').classList.add('active');
  }

  // 选择美食
  selectDish(dish) {
    this.selectedDish = dish;

    document.querySelectorAll('.food-item').forEach(item => item.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    document.getElementById('food-detail-img').src = `assets/images/${dish.img}`;
    document.getElementById('food-detail-name').textContent = dish.name;
    document.getElementById('food-detail-desc').textContent = dish.desc;
    document.getElementById('food-type-tag').textContent = '本源美食';

    // 渲染进化分支
    const branchesDiv = document.getElementById('food-branches');
    branchesDiv.innerHTML = '';
    dish.branches.forEach(branch => {
      const div = document.createElement('div');
      div.className = `branch-item ${branch.unlocked ? 'unlocked' : ''}`;
      div.innerHTML = `
        <img src="assets/images/${dish.img}" alt="${branch.name}">
        <div class="branch-name">${branch.name}</div>
        <div class="branch-condition">${branch.unlocked ? branch.condition : '成功制作一次后解锁'}</div>
      `;
      branchesDiv.appendChild(div);
    });
  }

  // 重置美食详情为默认提示
  resetFoodDetail() {
    document.getElementById('food-detail-img').src = 'assets/images/美食 全肉环香煲.png';
    document.getElementById('food-detail-name').textContent = '请选择一个美食';
    document.getElementById('food-detail-desc').textContent = '点击下方美食卡片查看详情';
    document.getElementById('food-type-tag').textContent = '美食类型';
    document.getElementById('food-branches').innerHTML = '';
  }

  // 显示美食详细信息弹窗
  showFoodInfo() {
    if (!this.selectedDish) return;

    document.getElementById('food-info-name').textContent = this.selectedDish.name;
    document.getElementById('food-info-img').src = `assets/images/${this.selectedDish.img}`;
    document.getElementById('food-info-desc').innerHTML = `
      <p><strong>简介：</strong>${this.selectedDish.desc}</p>
    `;

    const branchesDiv = document.getElementById('food-info-branches');
    branchesDiv.innerHTML = '<h4>进化分支</h4>';
    this.selectedDish.branches.forEach(branch => {
      const div = document.createElement('div');
      div.className = 'branch-info';
      div.innerHTML = `
        <div class="branch-info-name">${branch.name}</div>
        <div class="branch-info-cond">${branch.unlocked ? branch.condition : '成功制作一次后解锁'}</div>
      `;
      branchesDiv.appendChild(div);
    });

    document.getElementById('food-info-modal').classList.add('active');
  }

  // 显示图鉴弹窗
  showCollectionModal() {
    document.getElementById('collection-modal').classList.add('active');
    this.renderCollectionList('ingredients');
  }

  // 渲染图鉴列表
  renderCollectionList(type) {
    const list = document.getElementById('collection-list');
    list.innerHTML = '';

    if (type === 'ingredients') {
      Object.values(INGREDIENTS).forEach(ingredient => {
        const discovered = this.discoveredIngredients[ingredient.id];
        const item = document.createElement('div');
        item.className = `collection-item ${discovered ? '' : 'locked'}`;
        item.innerHTML = `
          <img src="assets/images/${ingredient.img}" alt="${ingredient.name}">
          <div class="collection-item-name">${discovered ? ingredient.name : '???'}</div>
          <div class="collection-item-type">${discovered ? INGREDIENT_TYPES[ingredient.type] : '未发现'}</div>
        `;
        if (discovered) {
          item.addEventListener('click', () => this.showCollectionItemDetail(ingredient, 'ingredient'));
        }
        list.appendChild(item);
      });
    } else {
      Object.values(TOOLS).forEach(tool => {
        const discovered = this.discoveredTools[tool.id];
        const item = document.createElement('div');
        item.className = `collection-item ${discovered ? '' : 'locked'}`;
        const qualityText = tool.type === 'common' ? '普通' : tool.type === 'rare' ? '优秀' : '极品';
        item.innerHTML = `
          <img src="assets/images/${tool.img}" alt="${tool.name}">
          <div class="collection-item-name">${discovered ? tool.name : '???'}</div>
          <div class="collection-item-type">${discovered ? qualityText : '未发现'}</div>
        `;
        if (discovered) {
          item.addEventListener('click', () => this.showCollectionItemDetail(tool, 'tool'));
        }
        list.appendChild(item);
      });
    }
  }

  // 显示图鉴物品详情
  showCollectionItemDetail(item, type) {
    document.getElementById('collection-detail-img').src = `assets/images/${item.img}`;
    document.getElementById('collection-detail-name').textContent = item.name;

    if (type === 'ingredient') {
      document.getElementById('collection-detail-type').textContent = INGREDIENT_TYPES[item.type];
      document.getElementById('collection-detail-stats').innerHTML = `
        <p><strong>属性加成：</strong></p>
        <p>良品质：色泽+${item.stats.good.color} | 味道+${item.stats.good.taste} | 品质+${item.stats.good.quality}</p>
        <p>佳品质：色泽+${item.stats.great.color} | 味道+${item.stats.great.taste} | 品质+${item.stats.great.quality}</p>
        <p>极品质：色泽+${item.stats.perfect.color} | 味道+${item.stats.perfect.taste} | 品质+${item.stats.perfect.quality}</p>
      `;
    } else {
      const qualityText = item.type === 'common' ? '普通' : item.type === 'rare' ? '优秀' : '极品';
      document.getElementById('collection-detail-type').textContent = `品质：${qualityText}`;
      document.getElementById('collection-detail-stats').innerHTML = `
        <p><strong>效果：</strong>${item.effect}</p>
      `;
    }

    document.getElementById('collection-detail-modal').classList.add('active');
  }

  // 开始游戏
  startGame() {
    // 应用角色天赋
    this.baseEnergy = 1500;
    if (this.selectedCookingCharacter) {
      // 太初食神·奥斯卡的天赋：初始精力增加300，每获得一件极品质食物获得70点精力
      if (this.selectedCookingCharacter.id === 'oscar') {
        this.baseEnergy += 300;
      }
    }

    this.energy = this.baseEnergy;
    this.currentLevel = 1;
    this.color = 0;
    this.taste = 0;
    this.quality = 0;
    this.ingredients = [];
    this.tools = [];
    this.ingredientCounts = {};
    this.perfectIngredients = {};
    this.minigameEncountered = false;
    this.colorBonus = 0;
    this.tasteBonus = 0;
    this.qualityBonus = 0;
    this.discount = 0;
    this.evolutionProgress = {};
    this.currentFoodEventType = null;
    this.evolvedDishName = null;

    this.showScreen('game');
    document.getElementById('cooking-food-img').src = `assets/images/${this.selectedDish.img}`;
    document.getElementById('cooking-food-name').textContent = this.selectedDish.name;

    // 使用角色的q版立绘
    if (this.selectedCookingCharacter) {
      document.getElementById('character-img').src = `assets/images/${this.selectedCookingCharacter.chibi}`;
    }

    this.updateUI();
    this.generateLevelButtons();
    this.updateStory();
    this.updateChat();
  }

  // 生成关卡按钮
  generateLevelButtons() {
    const buttonsDiv = document.getElementById('level-buttons');
    buttonsDiv.innerHTML = '';

    // 手动结算按钮（初始隐藏）
    const settleContainer = document.getElementById('settle-container');
    settleContainer.style.display = 'none';

    if (this.currentLevel === 1) {
      this.addButton('准备出发，获得随机厨具', 0, () => this.getRandomTools());
      return;
    }

    const options = this.generateOptions();
    options.forEach(opt => this.addButton(opt.text, opt.cost, opt.action));

    // 手动结算按钮（精力不足时显示）
    if (this.energy <= 0) {
      settleContainer.style.display = 'block';
    }
  }

  addButton(text, cost, action) {
    const buttonsDiv = document.getElementById('level-buttons');
    const actualCost = Math.floor(cost * (1 - this.discount / 100));

    const btn = document.createElement('button');
    btn.className = 'level-btn';
    btn.disabled = this.energy < actualCost;
    btn.innerHTML = `
      <div>${text}</div>
      ${cost > 0 ? `<div class="level-cost"><img src="assets/images/货币 精力.png">${actualCost}</div>` : ''}
    `;

    btn.addEventListener('click', () => {
      if (this.energy >= actualCost) {
        this.energy -= actualCost;
        this.updateUI(); // 立即更新精力显示
        action();
      }
    });

    buttonsDiv.appendChild(btn);
  }

  generateOptions() {
    const options = [];

    // 主食和配食选择事件
    const foodOptions = [
      { text: '体验百味人生，获得随机主食', cost: 100, action: () => this.getRandomIngredients('staple') },
      { text: '体验百味人生，获得随机配食', cost: 100, action: () => this.getRandomIngredients('side') }
    ];

    // 随机选一个食物事件
    const selectedFoodOption = foodOptions[Math.floor(Math.random() * foodOptions.length)];
    options.push(selectedFoodOption);

    // 检查是否还有可获得的厨具
    const availableTools = Object.values(TOOLS).filter(t =>
      !this.tools.some(ot => ot.id === t.id)
    );
    if (availableTools.length > 0) {
      options.push({
        text: '体验百味人生，获得随机厨具',
        cost: 100,
        action: () => this.getRandomTools()
      });
    }

    return options;
  }

  getRandomIngredients(type) {
    // 根据类型筛选食材
    const ingredientList = Object.values(INGREDIENTS).filter(i => i.type === type);
    const shuffled = ingredientList.sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 3);
    const perfectChance = SKILLS.skill3.levels[this.skills.skill3 - 1];

    // 记录当前选择的食材类型
    this.currentFoodEventType = type;

    this.showItemSelect(options, perfectChance, type, (selected) => {
      this.addIngredient(selected);
      this.finishLevel();
    });
  }

  getRandomTools() {
    const availableTools = Object.values(TOOLS).filter(t =>
      !this.tools.some(ot => ot.id === t.id)
    );

    if (availableTools.length === 0) {
      this.showAlert('没有可获得的厨具了！');
      return;
    }

    const shuffled = availableTools.sort(() => Math.random() - 0.5);
    const options = shuffled.slice(0, 3);

    this.showToolSelect(options, (selected) => {
      this.addTool(selected);
      this.finishLevel();
    });
  }

  showItemSelect(options, perfectChance, eventType, callback) {
    const optionsDiv = document.getElementById('item-options');
    optionsDiv.innerHTML = '';
    const eventTypeName = INGREDIENT_TYPES[eventType] || '食材';
    document.getElementById('item-select-title').textContent = `选择${eventTypeName}`;

    options.forEach(ingredient => {
      const rand = Math.random() * 100;
      let quality = 'good';
      if (rand < perfectChance) quality = 'perfect';
      else if (rand < perfectChance + 15) quality = 'great';

      const stats = ingredient.stats[quality];
      const qualityText = quality === 'good' ? '良' : quality === 'great' ? '佳' : '极';
      const typeName = INGREDIENT_TYPES[ingredient.type] || '食材';

      const option = document.createElement('div');
      option.className = `item-option ${quality}`;
      option.innerHTML = `
        <img src="assets/images/${ingredient.img}" alt="${ingredient.name}">
        <div class="item-name">${ingredient.name} (${qualityText})</div>
        <div class="item-type">${typeName}</div>
        <div class="item-stats">
          <span>色泽: ${stats.color}</span>
          <span>味道: ${stats.taste}</span>
          <span>品质: ${stats.quality}</span>
        </div>
      `;
      option.addEventListener('click', () => {
        document.getElementById('item-select-modal').classList.remove('active');

        // 检查是否选择了对应类型的食材
        if (ingredient.type !== eventType) {
          // 选择了不对应类型的食材，属性值降低5%
          this.showAlert(`这是${typeName}，但当前事件是选择${eventTypeName}，属性值降低5%！`);
          // 修改属性值，直接减少本次获得的属性
          callback({ ...ingredient, quality, penalty: true });
        } else {
          callback({ ...ingredient, quality });
        }
      });
      optionsDiv.appendChild(option);
    });

    document.getElementById('item-select-modal').classList.add('active');
  }

  showToolSelect(options, callback) {
    const optionsDiv = document.getElementById('item-options');
    optionsDiv.innerHTML = '';
    document.getElementById('item-select-title').textContent = '选择厨具';

    options.forEach(tool => {
      const qualityText = tool.type === 'common' ? '普通' : tool.type === 'rare' ? '优秀' : '极品';
      const option = document.createElement('div');
      option.className = `item-option ${tool.type}`;
      option.innerHTML = `
        <img src="assets/images/${tool.img}" alt="${tool.name}">
        <div class="item-name">${tool.name} (${qualityText})</div>
        <div class="item-stats">${tool.effect}</div>
      `;
      option.addEventListener('click', () => {
        document.getElementById('item-select-modal').classList.remove('active');
        callback(tool);
      });
      optionsDiv.appendChild(option);
    });

    document.getElementById('item-select-modal').classList.add('active');
  }

  addIngredient(ingredient, skipReward = false) {
    // 记录到图鉴
    if (!this.discoveredIngredients[ingredient.id]) {
      this.discoveredIngredients[ingredient.id] = true;
    }

    if (!this.ingredientCounts[ingredient.id]) this.ingredientCounts[ingredient.id] = 0;
    this.ingredientCounts[ingredient.id]++;
    if (ingredient.quality === 'perfect') {
      if (!this.perfectIngredients[ingredient.id]) this.perfectIngredients[ingredient.id] = 0;
      this.perfectIngredients[ingredient.id]++;

      // 角色天赋：太初食神·奥斯卡 - 每获得一件极品质食物获得70点精力
      if (this.selectedCookingCharacter && this.selectedCookingCharacter.id === 'oscar') {
        this.energy += 70;
      }
    }

    // 追踪进化进度
    if (!this.evolutionProgress[ingredient.id]) {
      this.evolutionProgress[ingredient.id] = { count: 0, perfectCount: 0 };
    }
    this.evolutionProgress[ingredient.id].count++;
    if (ingredient.quality === 'perfect') {
      this.evolutionProgress[ingredient.id].perfectCount++;
    }

    const existing = this.ingredients.find(i => i.id === ingredient.id && i.quality === ingredient.quality);
    if (existing) {
      existing.count = (existing.count || 1) + 1;
    } else {
      this.ingredients.push({ ...ingredient, count: 1 });
    }

    const stats = ingredient.stats[ingredient.quality];
    // 如果有惩罚标记，属性值降低5%
    let colorAdd = stats.color;
    let tasteAdd = stats.taste;
    let qualityAdd = stats.quality;

    if (ingredient.penalty) {
      colorAdd = Math.floor(colorAdd * 0.95);
      tasteAdd = Math.floor(tasteAdd * 0.95);
      qualityAdd = Math.floor(qualityAdd * 0.95);
    }

    this.color += colorAdd;
    this.taste += tasteAdd;
    this.quality += qualityAdd;

    this.updateUI();
    if (!skipReward) {
      this.showReward(ingredient, '食材');
    }
  }

  addTool(tool) {
    // 记录到图鉴
    if (!this.discoveredTools[tool.id]) {
      this.discoveredTools[tool.id] = true;
    }

    this.tools.push({ ...tool });
    if (tool.effectType === 'color') this.colorBonus += tool.effectValue;
    if (tool.effectType === 'taste') this.tasteBonus += tool.effectValue;
    if (tool.effectType === 'quality') this.qualityBonus += tool.effectValue;
    if (tool.effectType === 'discount') this.discount += tool.effectValue;

    this.updateUI();
    this.showReward(tool, '厨具');
  }

  showReward(item, type) {
    document.getElementById('reward-title').textContent = `获得${type}`;
    document.getElementById('reward-img').src = `assets/images/${item.img}`;
    document.getElementById('reward-name').textContent = item.name;
    document.getElementById('reward-desc').textContent = item.effect || '';
    document.getElementById('reward-modal').classList.add('active');
  }

  showItemDetail(item, type) {
    document.getElementById('detail-img').src = `assets/images/${item.img}`;
    document.getElementById('detail-name').textContent = item.name;
    if (type === 'ingredient') {
      const qualityText = item.quality === 'good' ? '良' : item.quality === 'great' ? '佳' : '极';
      const stats = item.stats[item.quality];
      document.getElementById('detail-desc').innerHTML = `
        <div>品质: ${qualityText}</div>
        <div>色泽: ${stats.color} | 味道: ${stats.taste} | 品质: ${stats.quality}</div>
      `;
    } else {
      document.getElementById('detail-desc').textContent = item.effect;
    }
    document.getElementById('item-detail-modal').classList.add('active');
  }

  finishLevel() {
    this.currentLevel++;

    const distiller = this.tools.find(t => t.id === 'distiller');
    if (distiller) this.energy += 20;

    this.switchBackground();
    this.updateUI();
    this.updateStory();
    this.updateChat();
    this.generateLevelButtons();
    this.checkEnergy();
  }

  switchBackground() {
    this.currentBgIndex = (this.currentBgIndex + 1) % this.backgrounds.length;
    const bgImg = document.getElementById('bg-img');
    bgImg.style.opacity = '0';
    setTimeout(() => {
      bgImg.src = `assets/images/${this.backgrounds[this.currentBgIndex]}`;
      bgImg.style.opacity = '1';
    }, 300);
  }

  checkEnergy() {
    const buttons = document.querySelectorAll('.level-btn');
    let canContinue = false;
    buttons.forEach(btn => {
      if (!btn.disabled) canContinue = true;
    });

    // 精力不足时显示手动结算按钮
    const settleContainer = document.getElementById('settle-container');
    if (!canContinue && this.currentLevel > 1) {
      settleContainer.style.display = 'block';
    } else {
      settleContainer.style.display = 'none';
    }
  }

  updateUI() {
    document.getElementById('energy-value').textContent = Math.floor(this.energy);

    const maxStat = 500;
    document.getElementById('color-fill').style.width = Math.min(this.color / maxStat * 100, 100) + '%';
    document.getElementById('taste-fill').style.width = Math.min(this.taste / maxStat * 100, 100) + '%';
    document.getElementById('quality-fill').style.width = Math.min(this.quality / maxStat * 100, 100) + '%';

    document.getElementById('color-value').textContent = Math.floor(this.color);
    document.getElementById('taste-value').textContent = Math.floor(this.taste);
    document.getElementById('quality-value').textContent = Math.floor(this.quality);

    // 厨具栏
    const toolsDiv = document.getElementById('tools-items');
    toolsDiv.innerHTML = '';
    this.tools.forEach(tool => {
      const div = document.createElement('div');
      div.className = `tool-item ${tool.type}`;
      div.innerHTML = `<img src="assets/images/${tool.img}" alt="${tool.name}">`;
      div.addEventListener('click', () => this.showItemDetail(tool, 'tool'));
      toolsDiv.appendChild(div);
    });

    // 食材栏
    const ingredientsDiv = document.getElementById('ingredients-items');
    ingredientsDiv.innerHTML = '';
    this.ingredients.forEach(item => {
      const div = document.createElement('div');
      div.className = `ingredient-item ${item.quality}`;
      div.innerHTML = `
        <img src="assets/images/${item.img}" alt="${item.name}">
        ${item.count > 1 ? `<span class="count">${item.count}</span>` : ''}
      `;
      div.addEventListener('click', () => this.showItemDetail(item, 'ingredient'));
      ingredientsDiv.appendChild(div);
    });

    this.updateDrillDisplay();
  }

  updateStory() {
    const story = STORIES[Math.floor(Math.random() * STORIES.length)];
    document.getElementById('story-text').textContent = story;
  }

  updateChat() {
    const chat = CHATS[Math.floor(Math.random() * CHATS.length)];
    document.getElementById('chat-text').textContent = chat;
  }

  renderSkillTree() {
    const treeDiv = document.getElementById('skill-tree');
    treeDiv.innerHTML = '';
    this.updateDrillDisplay();

    Object.values(SKILLS).forEach(skill => {
      const currentLevel = this.skills[skill.id] || 1;
      const cost = currentLevel < 5 ? skill.costs[currentLevel - 1] : null;

      const item = document.createElement('div');
      item.className = 'skill-item';

      let levelDots = '';
      for (let i = 1; i <= 5; i++) {
        levelDots += `<div class="skill-dot ${i <= currentLevel ? 'active' : ''}"></div>`;
      }

      item.innerHTML = `
        <div class="skill-name">${skill.name}</div>
        <div class="skill-desc">${skill.desc} ${skill.levels[currentLevel - 1]}%</div>
        <div class="skill-levels">${levelDots}</div>
        ${cost ? `<button class="upgrade-btn">升级 (${cost}钻研)</button>` : '<button class="upgrade-btn" disabled>已满级</button>'}
      `;

      const upgradeBtn = item.querySelector('.upgrade-btn');
      if (cost && this.drill >= cost) {
        upgradeBtn.addEventListener('click', () => {
          this.drill -= cost;
          this.skills[skill.id]++;
          this.discount = SKILLS.skill2.levels[this.skills.skill2 - 1];
          this.saveCurrentAccount();
          this.renderSkillTree();
        });
      } else if (cost) {
        upgradeBtn.disabled = true;
      }

      treeDiv.appendChild(item);
    });
  }

  showResult() {
    const colorFinal = this.color * (1 + this.colorBonus / 100);
    const tasteFinal = this.taste * (1 + this.tasteBonus / 100);
    const qualityFinal = this.quality * (1 + this.qualityBonus / 100);

    const uniqueFoods = new Set(this.ingredients.map(i => i.id)).size;
    const skill4Bonus = SKILLS.skill4.levels[this.skills.skill4 - 1] * uniqueFoods / 100;

    const total = Math.floor((colorFinal + tasteFinal + qualityFinal) * (1 + skill4Bonus));
    const drillGain = Math.floor(total * 0.05);
    this.drill += drillGain;

    // 检查进化条件
    this.evolvedDishName = this.checkEvolution();

    // 保存美食数据到账号
    if (this.currentAccount) {
      if (!this.accounts[this.currentAccount].dishes) {
        this.accounts[this.currentAccount].dishes = [];
      }

      const dishName = this.evolvedDishName || this.selectedDish.name;
      this.accounts[this.currentAccount].dishes.push({
        name: dishName,
        img: this.selectedDish.img,
        score: total,
        color: Math.floor(colorFinal),
        taste: Math.floor(tasteFinal),
        quality: Math.floor(qualityFinal),
        timestamp: Date.now()
      });
    }

    this.saveCurrentAccount();

    // 显示进化后的美食名称（如果有）
    const dishName = this.evolvedDishName || this.selectedDish.name;
    document.getElementById('result-food-img').src = `assets/images/${this.selectedDish.img}`;
    document.getElementById('result-food-name').textContent = dishName;
    document.getElementById('result-color').textContent = Math.floor(colorFinal);
    document.getElementById('result-taste').textContent = Math.floor(tasteFinal);
    document.getElementById('result-quality').textContent = Math.floor(qualityFinal);
    document.getElementById('result-score').textContent = total;
    document.getElementById('result-drill').textContent = drillGain;

    this.showScreen('result');
  }

  // 检查美食进化条件 - 返回最先满足的条件
  checkEvolution() {
    const dish = this.selectedDish;
    if (!dish || !dish.branches) return null;

    // 记录所有满足的条件及其满足顺序
    const satisfiedBranches = [];

    for (let i = 0; i < dish.branches.length; i++) {
      const branch = dish.branches[i];
      const condition = branch.condition;

      // 跳过"该分支暂未解锁"的条件
      if (condition.includes('暂未解锁')) continue;

      let matched = false;
      let satisfyOrder = Infinity;

      // 解析条件
      // "在烹饪中累计获得三次团圆饺子" 或 "累积获得三次..."
      const match3 = condition.match(/(累计|累积)获得三次(\S+)/);
      if (match3) {
        const ingredientName = match3[2];
        const ingredient = Object.values(INGREDIENTS).find(i => i.name === ingredientName);
        if (ingredient && this.evolutionProgress[ingredient.id]?.count >= 3) {
          matched = true;
          // 用获得次数作为满足顺序的指标
          satisfyOrder = this.evolutionProgress[ingredient.id].count;
        }
      }

      // "在烹饪中累计获得一次极-牛排块，一次极-柠檬羊排"
      const matchPerfect = condition.match(/获得一次极-(\S+).*一次极-(\S+)/);
      if (matchPerfect) {
        const name1 = matchPerfect[1];
        const name2 = matchPerfect[2];
        const ing1 = Object.values(INGREDIENTS).find(i => i.name === name1);
        const ing2 = Object.values(INGREDIENTS).find(i => i.name === name2);
        if (ing1 && ing2 &&
            this.evolutionProgress[ing1.id]?.perfectCount >= 1 &&
            this.evolutionProgress[ing2.id]?.perfectCount >= 1) {
          matched = true;
          // 用极品质获得次数作为满足顺序
          satisfyOrder = this.evolutionProgress[ing1.id].perfectCount + this.evolutionProgress[ing2.id].perfectCount;
        }
      }

      // "在烹饪中累计获得一次青草提拉米苏" 或 "累积获得一次..."
      const match1 = condition.match(/(累计|累积)获得一次(\S+)/);
      if (match1 && !matchPerfect) {
        const ingredientName = match1[2];
        const ingredient = Object.values(INGREDIENTS).find(i => i.name === ingredientName);
        if (ingredient && this.evolutionProgress[ingredient.id]?.count >= 1) {
          matched = true;
          satisfyOrder = this.evolutionProgress[ingredient.id].count;
        }
      }

      if (matched && !branch.unlocked) {
        satisfiedBranches.push({
          branch,
          index: i,
          satisfyOrder
        });
      }
    }

    // 如果有多个满足的条件，选择满足顺序最小的（最先满足的）
    if (satisfiedBranches.length > 0) {
      satisfiedBranches.sort((a, b) => a.satisfyOrder - b.satisfyOrder);
      const firstSatisfied = satisfiedBranches[0];
      firstSatisfied.branch.unlocked = true;
      return firstSatisfied.branch.name;
    }

    return null;
  }

  resetGame() {
    this.selectedDish = null;
    this.selectedCookingCharacter = null;
    this.energy = 1500;
    this.baseEnergy = 1500;
    this.currentLevel = 1;
    this.color = 0;
    this.taste = 0;
    this.quality = 0;
    this.ingredients = [];
    this.tools = [];
    this.colorBonus = 0;
    this.tasteBonus = 0;
    this.qualityBonus = 0;
    this.discount = 0;
    this.ingredientCounts = {};
    this.perfectIngredients = {};
    this.minigameEncountered = false;
    this.evolutionProgress = {};
    this.currentFoodEventType = null;
    this.evolvedDishName = null;
  }

  // ========== 常胜斗擂功能 ==========

  // 渲染常胜斗擂界面
  initArenaScreen() {
    document.getElementById('btn-back-arena').addEventListener('click', () => {
      this.showScreen('hall');
    });

    document.getElementById('arena-ai').addEventListener('click', () => {
      this.startAIBattle();
    });

    document.getElementById('arena-pvp').addEventListener('click', () => {
      this.showRoomModal();
    });

    document.getElementById('arena-4p').addEventListener('click', () => {
      this.showAlert('该玩法暂未开放');
    });

    // 游戏规则按钮
    document.getElementById('btn-battle-rules').addEventListener('click', () => {
      document.getElementById('battle-rules-modal').classList.add('active');
    });

    document.getElementById('rules-close').addEventListener('click', () => {
      document.getElementById('battle-rules-modal').classList.remove('active');
    });

    // 难度选择
    document.getElementById('difficulty-slider').addEventListener('input', (e) => {
      document.getElementById('difficulty-value').textContent = e.target.value + '%';
    });

    document.getElementById('btn-easy').addEventListener('click', () => {
      document.getElementById('difficulty-slider').value = 90;
      document.getElementById('difficulty-value').textContent = '90%';
    });

    document.getElementById('btn-normal').addEventListener('click', () => {
      document.getElementById('difficulty-slider').value = 100;
      document.getElementById('difficulty-value').textContent = '100%';
    });

    document.getElementById('btn-hard').addEventListener('click', () => {
      document.getElementById('difficulty-slider').value = 150;
      document.getElementById('difficulty-value').textContent = '150%';
    });

    document.getElementById('btn-hell').addEventListener('click', () => {
      document.getElementById('difficulty-slider').value = 300;
      document.getElementById('difficulty-value').textContent = '300%';
      document.getElementById('atk-difficulty-slider').value = 300;
      document.getElementById('atk-difficulty-value').textContent = '300%';
    });

    document.getElementById('btn-confirm-difficulty').addEventListener('click', () => {
      this.confirmDifficulty();
    });

    document.getElementById('difficulty-close').addEventListener('click', () => {
      document.getElementById('difficulty-modal').classList.remove('active');
    });

    // 攻击力难度滑动条
    document.getElementById('atk-difficulty-slider').addEventListener('input', (e) => {
      document.getElementById('atk-difficulty-value').textContent = e.target.value + '%';
    });

    // 敌人携带美食选项
    document.getElementById('enemy-carry-dish').addEventListener('change', (e) => {
      document.getElementById('enemy-dish-count').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('enemy-dish-slider').addEventListener('input', (e) => {
      document.getElementById('enemy-dish-count-value').textContent = e.target.value;
    });
  }

  // 显示房间弹窗
  showRoomModal() {
    document.getElementById('room-modal').classList.add('active');
    document.getElementById('room-info').style.display = 'none';
    document.getElementById('join-input').style.display = 'none';
    document.querySelector('.room-options').style.display = 'flex';
  }

  // 创建房间
  createRoom() {
    this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('room-code').textContent = this.roomCode;
    document.querySelector('.room-options').style.display = 'none';
    document.getElementById('room-info').style.display = 'block';

    // 显示等待提示，不自动开始（实际需要WebSocket）
    // 玩家需要等待另一个玩家加入房间
    // 这里不设置自动开始的setTimeout，等待功能需要后端WebSocket支持
  }

  // 加入房间
  joinRoom(code) {
    // 模拟加入房间 - 实际需要WebSocket验证
    // 房主端需要有玩家加入的通知
    document.getElementById('room-modal').classList.remove('active');
    this.battleMode = 'pvp';
    this.showScreen('character-select');
    this.renderCharacterSelect();
    this.startCharSelectTimer();
  }

  // 玩家加入房间后的处理（供WebSocket调用）
  onPlayerJoinRoom() {
    document.getElementById('room-modal').classList.remove('active');
    this.battleMode = 'pvp';
    this.showScreen('character-select');
    this.renderCharacterSelect();
    this.startCharSelectTimer();
  }

  // 开始人机战斗
  startAIBattle() {
    this.battleMode = 'ai';
    // 显示难度选择弹窗
    document.getElementById('difficulty-modal').classList.add('active');
    this.selectedCharacter = null;
  }

  // 确认难度并开始
  confirmDifficulty() {
    const slider = document.getElementById('difficulty-slider');
    const atkSlider = document.getElementById('atk-difficulty-slider');
    this.difficultyMultiplier = parseInt(slider.value) / 100;
    this.atkDifficultyMultiplier = parseInt(atkSlider.value) / 100;

    // 敌人是否携带美食
    this.enemyCarryDish = document.getElementById('enemy-carry-dish').checked;
    if (this.enemyCarryDish) {
      this.enemyDishCount = parseInt(document.getElementById('enemy-dish-slider').value);
    }

    document.getElementById('difficulty-modal').classList.remove('active');
    this.showScreen('character-select');
    this.renderCharacterSelect();
    this.startCharSelectTimer();
  }

  // ========== 角色选择 ==========

  renderCharacterSelect() {
    const charList = document.getElementById('char-list-area');
    charList.innerHTML = '';

    // 初始不显示立绘 - 按照调整06215要求
    document.getElementById('char-preview-img').style.display = 'none';
    document.getElementById('char-preview-img').src = '';
    document.getElementById('char-preview-name').textContent = '请选择角色';
    this.selectedCharacter = null;
    this.updateCharInfo(null);

    // 调整062110：只显示已解锁的角色
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};

    Object.values(CHARACTERS).forEach(char => {
      const isUnlocked = unlockedChars[char.id]?.unlocked || false;

      const card = document.createElement('div');
      card.className = `char-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <img src="assets/images/${char.avatar}" alt="${char.name}" style="${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.5;'}">
        <div class="char-card-name">${char.quality}<br>${char.name}</div>
        ${isUnlocked ? '' : '<div style="font-size:10px;color:#999;">未解锁</div>'}
      `;

      // 调整062110：只有解锁的角色才能点击选择
      if (isUnlocked) {
        card.addEventListener('click', () => this.selectCharacter(char));
      } else {
        card.style.cursor = 'not-allowed';
        card.title = '该角色尚未解锁';
      }
      charList.appendChild(card);
    });

    // 绑定属性/技能切换按钮
    document.querySelectorAll('.char-info-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.char-info-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.toggleCharInfoTab(tab.dataset.tab);
      });
    });

    // 初始显示
    this.updateCharInfo(null);
  }

  selectCharacter(char) {
    // 调整062110：检查角色是否已解锁
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};
    if (!unlockedChars[char.id]?.unlocked) {
      this.showAlert('该角色尚未解锁，无法使用！');
      return;
    }

    this.selectedCharacter = char;

    // 更新选中状态
    document.querySelectorAll('#char-list-area .char-card').forEach(c => c.classList.remove('selected'));
    event.currentTarget.classList.add('selected');

    // 更新立绘 - 使用新的选择立绘图片（版本1.3更新）
    const portraitImg = document.getElementById('char-preview-img');
    if (char.id === 'rongrong') {
      portraitImg.src = 'assets/images/十方琉璃宁荣荣选择立绘.png';
    } else if (char.id === 'oscar') {
      portraitImg.src = 'assets/images/太初奥斯卡选择立绘.png';
    } else {
      portraitImg.src = `assets/images/${char.portrait}`;
    }
    portraitImg.style.display = 'block';

    // 更新角色名
    document.getElementById('char-preview-name').textContent = `${char.quality} ${char.name}`;

    // 更新信息显示
    this.updateCharInfo(char);
  }

  toggleCharInfoTab(tabName) {
    const statsDisplay = document.getElementById('char-stats-display');
    const skillsDisplay = document.getElementById('char-skills-display');

    if (tabName === 'stats') {
      statsDisplay.style.display = 'block';
      skillsDisplay.style.display = 'none';
    } else {
      statsDisplay.style.display = 'none';
      skillsDisplay.style.display = 'block';
    }
  }

  updateCharInfo(char) {
    const statsDisplay = document.getElementById('char-stats-display');
    const skillsDisplay = document.getElementById('char-skills-display');

    if (!char) {
      statsDisplay.innerHTML = '<p style="text-align:center;color:#888;">请选择一个角色</p>';
      skillsDisplay.innerHTML = '<p style="text-align:center;color:#888;">请选择一个角色</p>';
      return;
    }

    // 属性显示
    statsDisplay.innerHTML = `
      <div style="line-height:2;">
        <div><strong>品质:</strong> <span style="color:#ffa500;">${char.quality}</span></div>
        <div><strong>生命值:</strong> ${char.stats.hp}</div>
        <div><strong>攻击力:</strong> ${char.stats.atk}</div>
        <div><strong>暴击率:</strong> ${char.stats.critRate}%</div>
        <div><strong>暴击伤害:</strong> ${char.stats.critDmg}%</div>
        <div><strong>速度:</strong> ${char.stats.speed.min}-${char.stats.speed.max}</div>
      </div>
      <div style="margin-top:15px;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;">
        <strong style="color:#ffa500;">佳肴精研天赋:</strong>
        <p style="margin:5px 0;font-size:14px;">${char.cookingBonus}</p>
      </div>
    `;

    // 技能显示
    let skillsHtml = '';
    char.skills.forEach((skill, index) => {
      skillsHtml += `
        <div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px;margin-bottom:10px;">
          <div style="font-weight:bold;color:#ffa500;font-size:16px;">${skill.name}</div>
          <div style="font-size:13px;color:#ffcc00;margin:5px 0;">消耗魂力: ${skill.cost}</div>
          <div style="font-size:13px;line-height:1.5;">${skill.desc}</div>
        </div>
      `;
    });
    skillsDisplay.innerHTML = skillsHtml;
  }

  startCharSelectTimer() {
    this.charSelectTimeLeft = 60;
    const timerEl = document.getElementById('char-select-timer');

    if (this.charSelectTimer) clearInterval(this.charSelectTimer);

    this.charSelectTimer = setInterval(() => {
      this.charSelectTimeLeft--;
      timerEl.textContent = this.charSelectTimeLeft;

      if (this.charSelectTimeLeft <= 0) {
        clearInterval(this.charSelectTimer);
        if (!this.selectedCharacter) {
          // 自动选择第一个角色
          this.selectedCharacter = Object.values(CHARACTERS)[0];
        }
        this.startBattle();
      }
    }, 1000);

    // 绑定开始战斗按钮 - 调整06215：未选择时无法进入对局
    document.getElementById('btn-start-battle').onclick = () => {
      if (!this.selectedCharacter) {
        this.showAlert('请先选择一个角色！');
        return;
      }
      clearInterval(this.charSelectTimer);
      this.startBattle();
    };

    document.getElementById('btn-back-char-select').onclick = () => {
      clearInterval(this.charSelectTimer);
      this.showScreen('arena');
    };
  }

  // ========== 战斗系统 ==========

  startBattle() {
    // 确保已选择角色 - 调整06215：未选择时无法进入对局
    if (!this.selectedCharacter) {
      this.showAlert('请先选择一个角色！');
      this.showScreen('arena');
      return;
    }

    // 初始化战斗状态
    this.battleState = {
      playerHP: this.selectedCharacter.stats.hp,
      playerMaxHP: this.selectedCharacter.stats.hp,
      baseHP: this.selectedCharacter.stats.hp,
      playerSoul: 4,
      playerAtk: this.selectedCharacter.stats.atk,
      baseAtk: this.selectedCharacter.stats.atk,
      playerCritRate: this.selectedCharacter.stats.critRate,
      baseCritRate: this.selectedCharacter.stats.critRate,
      playerCritDmg: this.selectedCharacter.stats.critDmg,
      baseCritDmg: this.selectedCharacter.stats.critDmg,
      playerSpeed: this.selectedCharacter.stats.speed,
      playerBuffs: [],          // 增益效果
      playerDebuffs: [],        // 负面效果
      playerSpecialEffects: [], // 角色专属效果
      enemyHP: 0,
      enemyMaxHP: 0,
      baseEnemyHP: 0,
      baseEnemyAtk: 0,
      enemyAtk: 0,
      enemyChar: null,
      enemySpeed: null,
      turn: 1,
      enemyBuffs: [],
      enemyDebuffs: [],
      enemySpecialEffects: [],
      totalSoulConsumed: 0,     // 累计消耗魂力
      totalDamageDealt: 0,      // 累计造成伤害
      xiangyiStacks: 0,         // 【香溢】层数
      caiweiStacks: 0,          // 【彩味】层数
      jiangxinPoints: 0,        // 【匠心】点数
      yanqingqingfangActive: false, // 【宴请八方】是否激活
      yanqingqingfangTurns: 0,      // 【宴请八方】剩余回合
      liucaiActive: false,          // 【流彩】是否激活
      liucaiTurns: 0,               // 【流彩】剩余回合
      shunguangActive: false,       // 【舜光】是否激活
      shunguangTurns: 0,            // 【舜光】剩余回合
      playerActedFirst: true        // 本回合玩家是否先行动
    };

    // 人机模式：随机选择敌人
    if (this.battleMode === 'ai') {
      const chars = Object.values(CHARACTERS).filter(c => c.id !== this.selectedCharacter.id);
      if (chars.length === 0) {
        this.showAlert('没有可选的敌人角色！');
        return;
      }
      this.battleState.enemyChar = chars[Math.floor(Math.random() * chars.length)];
      this.battleState.baseEnemyHP = this.battleState.enemyChar.stats.hp;
      this.battleState.baseEnemyAtk = this.battleState.enemyChar.stats.atk;

      // 应用生命值难度倍率（90%到1000%）
      const hpMultiplier = this.difficultyMultiplier || 1;
      this.battleState.enemyMaxHP = Math.floor(this.battleState.baseEnemyHP * hpMultiplier);
      this.battleState.enemyHP = this.battleState.enemyMaxHP;

      // 应用攻击力难度倍率（90%到1000%）
      const atkMultiplier = this.atkDifficultyMultiplier || 1;
      this.battleState.enemyAtk = Math.floor(this.battleState.baseEnemyAtk * atkMultiplier);
      this.battleState.enemySpeed = this.battleState.enemyChar.stats.speed;

      // 敌人携带美食
      if (this.enemyCarryDish && this.enemyDishCount) {
        this.enemyDishes = this.generateRandomDishes(this.enemyDishCount);
      } else {
        this.enemyDishes = [];
      }
    } else {
      // PVP模式不给敌人美食
      this.enemyDishes = [];
    }

    // 应用美食效果（包括战斗中显示的美食）
    this.applyDishEffects();

    // 清空战斗日志
    document.getElementById('battle-log').innerHTML = '';

    // 非经典蛋包饭：生命值降低20%
    if (this.battleDishes.some(d => d.name.includes('非经典'))) {
      const tasteScore = this.battleDishes.find(d => d.name.includes('非经典')).taste || 0;
      const reduction = 0.20 - (Math.floor(tasteScore / 100) * 0.03);
      this.battleState.playerHP = Math.floor(this.battleState.playerHP * (1 - reduction));
      this.battleState.playerMaxHP = Math.floor(this.battleState.playerMaxHP * (1 - reduction));
      this.addBattleLog(`【非经典蛋包饭】效果：生命值降低${Math.floor(reduction * 100)}%`);
    }

    this.showScreen('battle');
    this.renderBattle();
    this.addBattleLog(`战斗开始！${this.selectedCharacter.name} VS ${this.battleState.enemyChar.name}`);

    // 第一回合速度判定
    this.doSpeedCheck();
  }

  // 应用美食战斗加成效果
  applyDishEffects() {
    // 获取已装备的美食（不依赖珍馐陈设界面是否打开过）
    this.battleDishes = [];

    // 从账号数据中获取已装备美食
    if (this.currentAccount && this.accounts[this.currentAccount]) {
      const equippedDishes = this.accounts[this.currentAccount].equippedDishes || {};
      for (let slot in equippedDishes) {
        const dish = equippedDishes[slot];
        if (dish) {
          this.battleDishes.push(dish);
        }
      }
    }

    // 如果没有装备美食，也可以使用默认空数组
  }

  // 计算美食加成效果
  calculateDishBonus() {
    let atkBonus = 0;

    this.battleDishes.forEach(dish => {
      const bonusData = DISH_BONUSES[this.getDishId(dish.name)];
      if (!bonusData) return;

      const score = dish.score || 0;
      const colorScore = dish.color || 0;
      const tasteScore = dish.taste || 0;
      const qualityScore = dish.quality || 0;

      // 本源效果：每经过2个回合，攻击力永久提高10%
      if (bonusData.id === 'meatStew' || bonusData.name === '全肉环香煲') {
        atkBonus += Math.floor(this.battleState.turn / 2) * 10;
        atkBonus += Math.floor(score / 1000) * 10;
      }

      // 四喜丸子意面：每回合开始时额外获得1点魂力
      if (bonusData.id === 'fourJoyPasta' || bonusData.name === '四喜丸子意面') {
        this.battleState.playerSoul = Math.min(6, this.battleState.playerSoul + 1);
      }

      // 蛋包饭：每回合恢复5%最大生命值
      if (bonusData.id === 'omurice' || bonusData.name === '蛋包饭') {
        const heal = Math.floor(this.battleState.playerMaxHP * 0.05);
        this.battleState.playerHP = Math.min(this.battleState.playerMaxHP, this.battleState.playerHP + heal);
      }
    });

    return atkBonus;
  }

  getDishId(name) {
    // 根据美食名称获取ID
    if (name.includes('全肉环香煲')) return 'meatStew';
    if (name.includes('四喜丸子意面')) return 'fourJoyPasta';
    if (name.includes('蛋包饭')) return 'omurice';
    return null;
  }

  // 生成随机美食给敌人
  generateRandomDishes(count) {
    const allDishNames = [
      '全肉环香煲', '团圆全肉环香煲', '醇香全肉环香煲', '流溢全肉环香煲',
      '四喜丸子意面', '彩彩四喜丸子意面', '清新四喜丸子意面',
      '蛋包饭', '非经典蛋包饭', '酥脆蛋包饭'
    ];
    const dishes = [];
    const shuffled = allDishNames.sort(() => Math.random() - 0.5);
    for (let i = 0; i < count && i < shuffled.length; i++) {
      dishes.push({
        name: shuffled[i],
        img: this.getDishImage(shuffled[i]),
        score: Math.floor(Math.random() * 500) + 200,
        color: Math.floor(Math.random() * 100) + 50,
        taste: Math.floor(Math.random() * 100) + 50,
        quality: Math.floor(Math.random() * 100) + 50
      });
    }
    return dishes;
  }

  getDishImage(name) {
    if (name.includes('全肉环香煲')) return '美食 全肉环香煲.png';
    if (name.includes('四喜丸子意面')) return '美食 四喜丸子意面.png';
    if (name.includes('蛋包饭')) return '美食 蛋包饭.png';
    return '美食 全肉环香煲.png';
  }

  renderBattle() {
    // 确保战斗状态已初始化
    if (!this.battleState || !this.battleState.enemyChar) {
      console.error('战斗状态未正确初始化');
      this.showAlert('战斗初始化失败，请重试');
      this.showScreen('arena');
      return;
    }

    // 更新左上角头像
    document.getElementById('battle-avatar-img').src = `assets/images/${this.selectedCharacter.avatar}`;

    // 更新角色图片
    document.getElementById('player-char-img').src = `assets/images/${this.selectedCharacter.chibi}`;
    document.getElementById('enemy-char-img').src = `assets/images/${this.battleState.enemyChar.chibi}`;

    // 更新血条
    this.updateHPBars();

    // 更新魂力
    document.getElementById('soul-value').textContent = this.battleState.playerSoul;

    // 更新状态栏
    this.updateStatusPanels();

    // 更新美食栏
    this.updateDishPanels();

    // 版本1.3更新：更新敌人美食栏显示
    this.updateEnemyDishPanel();

    // 生成技能
    this.generateBattleSkills();

    // 绑定头像投降按钮
    document.getElementById('btn-battle-surrender').onclick = () => {
      if (confirm('确定要投降吗？')) {
        this.endBattle(false);
      }
    };
  }

  // 更新状态栏
  updateStatusPanels() {
    const playerStatusList = document.getElementById('player-status-list');
    const enemyStatusList = document.getElementById('enemy-status-list');

    playerStatusList.innerHTML = '';
    enemyStatusList.innerHTML = '';

    // 玩家状态 - 添加点击查看详情功能
    [...this.battleState.playerBuffs, ...this.battleState.playerDebuffs, ...this.battleState.playerSpecialEffects].forEach(effect => {
      const div = document.createElement('div');
      div.className = `status-item ${effect.type}`;
      div.textContent = `${effect.name} ${effect.duration > 0 ? effect.duration : '∞'}`;
      div.addEventListener('click', () => this.showBattleStatusDetail(effect));
      playerStatusList.appendChild(div);
    });

    // 敌方状态
    [...(this.battleState.enemyBuffs || []), ...(this.battleState.enemyDebuffs || []), ...(this.battleState.enemySpecialEffects || [])].forEach(effect => {
      const div = document.createElement('div');
      div.className = `status-item ${effect.type}`;
      div.textContent = `${effect.name} ${effect.duration > 0 ? effect.duration : '∞'}`;
      div.addEventListener('click', () => this.showBattleStatusDetail(effect));
      enemyStatusList.appendChild(div);
    });

    // 特殊效果：香溢、彩味、匠心 - 按调整06215要求归到状态栏
    if (this.battleState.xiangyiStacks > 0) {
      const div = document.createElement('div');
      div.className = 'status-item special';
      div.textContent = `香溢 x${this.battleState.xiangyiStacks}`;
      div.addEventListener('click', () => this.showBattleStatusDetail({
        name: '香溢',
        type: 'special',
        desc: '每层永久提高攻击力13%，品质评分每有100，再提高5%',
        duration: -1
      }));
      playerStatusList.appendChild(div);
    }

    if (this.battleState.caiweiStacks > 0) {
      const div = document.createElement('div');
      div.className = 'status-item special';
      div.textContent = `彩味 x${this.battleState.caiweiStacks}`;
      div.addEventListener('click', () => this.showBattleStatusDetail({
        name: '彩味',
        type: 'special',
        desc: '造成伤害时消耗1层，对敌方施加【烧伤】【冰冻】【风化】中的随机一种效果（1回合，冰冻除外）',
        duration: -1
      }));
      playerStatusList.appendChild(div);
    }

    if (this.battleState.jiangxinPoints > 0) {
      const div = document.createElement('div');
      div.className = 'status-item special';
      div.textContent = `匠心 ${this.battleState.jiangxinPoints}点`;
      div.addEventListener('click', () => this.showBattleStatusDetail({
        name: '匠心',
        type: 'special',
        desc: '每获得100点，本场战斗自身攻击力永久提高15%，然后清空点数',
        duration: -1
      }));
      playerStatusList.appendChild(div);
    }

    // 【宴请八方】状态
    if (this.battleState.yanqingqingfangActive) {
      const div = document.createElement('div');
      div.className = 'status-item buff';
      div.textContent = `宴请八方 ${this.battleState.yanqingqingfangTurns}`;
      div.addEventListener('click', () => this.showBattleStatusDetail({
        name: '宴请八方',
        type: 'buff',
        desc: '暴击率提高15%（或25%如果星座四解锁），释放技能时每消耗1点魂力，最终伤害提高10%（或20%）',
        duration: this.battleState.yanqingqingfangTurns
      }));
      playerStatusList.appendChild(div);
    }

    // 【流彩】状态
    if (this.battleState.liucaiActive) {
      const div = document.createElement('div');
      div.className = 'status-item buff';
      div.textContent = `流彩 ${this.battleState.liucaiTurns}`;
      div.addEventListener('click', () => this.showBattleStatusDetail({
        name: '流彩',
        type: 'buff',
        desc: '最大生命值提高17%（或23%如果星座一解锁）。同时存在【流彩】和【舜光】时，额外提高暴击伤害50%',
        duration: this.battleState.liucaiTurns
      }));
      playerStatusList.appendChild(div);
    }

    // 【舜光】状态
    if (this.battleState.shunguangActive) {
      const div = document.createElement('div');
      div.className = 'status-item buff';
      div.textContent = `舜光 ${this.battleState.shunguangTurns}`;
      div.addEventListener('click', () => this.showBattleStatusDetail({
        name: '舜光',
        type: 'buff',
        desc: '攻击力提高17%（或23%如果星座二解锁）。同时存在【流彩】和【舜光】时，额外提高暴击伤害50%',
        duration: this.battleState.shunguangTurns
      }));
      playerStatusList.appendChild(div);
    }
  }

  // 显示战斗状态详情弹窗
  showBattleStatusDetail(effect) {
    document.getElementById('battle-status-name').textContent = effect.name;
    document.getElementById('battle-status-type').textContent = effect.type === 'negative' ? '负面效果' : effect.type === 'buff' ? '增益效果' : '角色专属效果';
    document.getElementById('battle-status-type').className = `status-detail-type ${effect.type}`;
    document.getElementById('battle-status-desc').textContent = effect.desc;
    document.getElementById('battle-status-duration').textContent = effect.duration > 0 ? `剩余回合: ${effect.duration}` : '持续时间: 永久';
    document.getElementById('battle-status-detail-modal').classList.add('active');
  }

  // 更新美食栏 - 用图标显示
  updateDishPanels() {
    const playerDishList = document.getElementById('player-dish-list');
    playerDishList.innerHTML = '';

    this.battleDishes.forEach(dish => {
      const div = document.createElement('div');
      div.className = 'dish-icon';
      div.innerHTML = `<img src="assets/images/${dish.img}" alt="${dish.name}">`;
      div.addEventListener('click', () => this.showBattleDishDetail(dish));
      playerDishList.appendChild(div);
    });

    if (this.battleDishes.length === 0) {
      playerDishList.innerHTML = '<div style="color:#666;font-size:11px;text-align:center;padding:10px;">未装备美食</div>';
    }
  }

  // 显示战斗美食详情弹窗
  showBattleDishDetail(dish) {
    document.getElementById('battle-dish-name').textContent = dish.name;
    document.getElementById('battle-dish-img').src = `assets/images/${dish.img}`;
    document.getElementById('battle-dish-stats').innerHTML = `
      <p><strong>色泽:</strong> ${dish.color || 0}</p>
      <p><strong>味道:</strong> ${dish.taste || 0}</p>
      <p><strong>品质:</strong> ${dish.quality || 0}</p>
      <p><strong>总评分:</strong> ${dish.score || 0}</p>
    `;

    // 获取美食效果
    const dishId = this.getDishId(dish.name);
    const bonusData = DISH_BONUSES[dishId];
    let effectText = '暂无效果数据';
    if (bonusData) {
      effectText = `<strong>本源效果:</strong> ${bonusData.effect}`;
      // 检查是否是进化版本
      if (bonusData.branches && dish.name !== bonusData.name) {
        Object.values(bonusData.branches).forEach(branch => {
          if (branch.name === dish.name) {
            effectText += `<br><br><strong>进化效果:</strong> ${branch.effect}`;
          }
        });
      }
    }
    document.getElementById('battle-dish-effect').innerHTML = effectText;
    document.getElementById('battle-dish-detail-modal').classList.add('active');
  }

  updateHPBars() {
    const playerHPPercent = Math.max(0, (this.battleState.playerHP / this.battleState.playerMaxHP * 100)).toFixed(0);
    const enemyHPPercent = Math.max(0, (this.battleState.enemyHP / this.battleState.enemyMaxHP * 100)).toFixed(0);

    document.getElementById('player-hp-fill').style.width = playerHPPercent + '%';
    document.getElementById('player-hp-text').textContent = playerHPPercent + '%';

    document.getElementById('enemy-hp-fill').style.width = enemyHPPercent + '%';
    document.getElementById('enemy-hp-text').textContent = enemyHPPercent + '%';
  }

  generateBattleSkills() {
    const skillsDiv = document.getElementById('battle-skills');
    skillsDiv.innerHTML = '';

    // 随机选择5个技能（可重复）
    const allSkills = this.selectedCharacter.skills;
    for (let i = 0; i < 5; i++) {
      const skill = allSkills[Math.floor(Math.random() * allSkills.length)];
      const btn = document.createElement('button');
      btn.className = 'battle-skill-btn';
      btn.disabled = this.battleState.playerSoul < skill.cost;
      btn.innerHTML = `
        <div class="skill-name">${skill.name}</div>
        <div class="skill-cost">魂力: ${skill.cost}</div>
        <div class="skill-desc">${skill.desc}</div>
      `;
      btn.addEventListener('click', () => this.useSkill(skill));
      skillsDiv.appendChild(btn);
    }
  }

  useSkill(skill) {
    if (this.battleState.playerSoul < skill.cost) return;

    // 检查是否被冰冻
    const frozen = this.battleState.playerDebuffs.find(e => e.name === '冰冻');
    if (frozen) {
      this.addBattleLog(`你被冰冻了，无法行动！`);
      // 70%概率移除冰冻
      if (Math.random() < 0.7) {
        this.battleState.playerDebuffs = this.battleState.playerDebuffs.filter(e => e.name !== '冰冻');
        this.addBattleLog(`冰冻效果已解除！`);
      }
      this.updateStatusPanels();
      setTimeout(() => this.enemyTurn(), 1000);
      return;
    }

    // 消耗魂力
    this.battleState.playerSoul -= skill.cost;
    this.battleState.totalSoulConsumed += skill.cost;

    // 计算美食加成
    const dishBonus = this.calculateDishBonus();

    // 计算香溢加成（每层13%攻击力 + 品质评分加成）
    let xiangyiBonus = this.battleState.xiangyiStacks * 0.13;
    // 品质评分每有100，再提高5%
    if (this.battleDishes.some(d => d.name.includes('流溢'))) {
      const qualityScore = this.battleDishes.find(d => d.name.includes('流溢'))?.quality || 0;
      xiangyiBonus += Math.floor(qualityScore / 100) * 0.05;
    }

    // 计算伤害（加入暴击判定）
    let baseDamage = this.battleState.playerAtk * (1 + dishBonus / 100 + xiangyiBonus);
    let damage = Math.floor(baseDamage * (1 + Math.random() * 0.2));

    // 【宴请八方】效果：每消耗1点魂力，最终伤害提高10%（或20%）
    if (this.battleState.yanqingqingfangActive) {
      const yanqingBonus = this.selectedCharacter.id === 'oscar' &&
        this.selectedCharacter.constellations[3]?.unlocked ? 0.20 : 0.10;
      damage = Math.floor(damage * (1 + skill.cost * yanqingBonus));
    }

    // 【流彩】和【舜光】同时激活时，额外提高暴击伤害50%
    let extraCritDmg = 0;
    if (this.battleState.liucaiActive && this.battleState.shunguangActive) {
      extraCritDmg = 50;
    }

    const isCrit = Math.random() * 100 < this.battleState.playerCritRate;
    if (isCrit) {
      damage = Math.floor(damage * ((this.battleState.playerCritDmg + extraCritDmg) / 100));
    }

    // 根据技能处理特殊效果
    this.processSkillEffects(skill, damage, isCrit);

    this.battleState.enemyHP -= damage;
    this.battleState.totalDamageDealt += damage;

    // 显示伤害数字动画 - 调整06215
    this.showDamageNumber('enemy', damage, isCrit);

    // 获得香溢层数（流溢全肉环香煲效果）
    if (this.battleDishes.some(d => d.name.includes('流溢'))) {
      this.battleState.xiangyiStacks++;
      this.addBattleLog(`获得1层【香溢】，当前${this.battleState.xiangyiStacks}层`);
    }

    // 消耗彩味，施加负面效果（彩彩四喜丸子意面效果）
    if (this.battleState.caiweiStacks > 0 && this.battleDishes.some(d => d.name.includes('彩彩'))) {
      this.battleState.caiweiStacks--;
      const debuffs = ['烧伤', '冰冻', '风化'];
      const randomDebuff = debuffs[Math.floor(Math.random() * debuffs.length)];
      this.applyDebuff('enemy', randomDebuff);
      this.addBattleLog(`消耗【彩味】，对敌方施加【${randomDebuff}】！`);
    }

    // 检查风化效果（自己攻击时受到伤害）
    const windErosion = this.battleState.playerDebuffs.find(e => e.name === '风化');
    if (windErosion) {
      this.battleState.playerHP -= 300;
      this.showDamageNumber('player', 300, false);
      this.addBattleLog(`【风化】效果，自身受到300点伤害！`);
    }

    // 显示战斗日志
    const critText = isCrit ? '【暴击】' : '';
    this.addBattleLog(`${critText}${this.selectedCharacter.name} 使用 ${skill.name}，造成 ${damage} 点伤害！`);

    // 更新UI
    this.updateHPBars();
    this.updateStatusPanels();
    document.getElementById('soul-value').textContent = this.battleState.playerSoul;

    // 检查胜负
    if (this.battleState.enemyHP <= 0) {
      setTimeout(() => this.endBattle(true), 500);
      return;
    }

    // 根据速度判定决定行动顺序
    if (this.battleState.playerActedFirst) {
      // 玩家先行动，接下来是敌人回合
      setTimeout(() => this.enemyTurn(), 1000);
    } else {
      // 敌人先行动，玩家已经行动过，开始新回合
      this.startNewTurn();
    }
  }

  // 显示伤害数字动画 - 调整06215新增
  showDamageNumber(target, damage, isCrit) {
    const charImg = target === 'enemy'
      ? document.getElementById('enemy-char-img')
      : document.getElementById('player-char-img');

    // 添加受伤动画
    charImg.classList.add('damaged');
    setTimeout(() => charImg.classList.remove('damaged'), 150);

    // 创建伤害数字元素
    const damageEl = document.createElement('div');
    damageEl.className = `damage-number ${isCrit ? 'crit' : ''}`;
    damageEl.textContent = `-${damage}`;

    // 获取角色图片的位置
    const rect = charImg.getBoundingClientRect();
    damageEl.style.left = `${rect.left + rect.width / 2}px`;
    damageEl.style.top = `${rect.top + rect.height / 3}px`;

    document.body.appendChild(damageEl);

    // 动画结束后移除
    setTimeout(() => damageEl.remove(), 800);
  }

  // 处理技能特殊效果
  processSkillEffects(skill, baseDamage, isCrit) {
    const char = this.selectedCharacter;

    // 太初食神·奥斯卡的技能效果
    if (char.id === 'oscar') {
      if (skill.name === '五味归无') {
        // 造成3段伤害
        const totalDamage = baseDamage;
        // 恢复2点魂力
        this.battleState.playerSoul = Math.min(6, this.battleState.playerSoul + 2);
        // 获得10点【匠心】（或15点如果星座一解锁）
        const jiangxinGain = char.constellations[0]?.unlocked ? 15 : 10;
        this.battleState.jiangxinPoints += jiangxinGain;
        this.addBattleLog(`获得${jiangxinGain}点【匠心】，当前${this.battleState.jiangxinPoints}点`);
        // 检查匠心满100
        this.checkJiangxin();
      }
      else if (skill.name === '太初有余') {
        // 恢复1点魂力
        this.battleState.playerSoul = Math.min(6, this.battleState.playerSoul + 1);
        // 每50点匠心额外恢复1点
        const extraSoul = Math.floor(this.battleState.jiangxinPoints / 50);
        if (extraSoul > 0) {
          this.battleState.playerSoul = Math.min(6, this.battleState.playerSoul + extraSoul);
          this.addBattleLog(`【匠心】额外恢复${extraSoul}点魂力`);
        }
        // 每恢复1点魂力，攻击力永久提高3%
        const totalSoulRecovered = 1 + extraSoul;
        this.battleState.playerAtk = Math.floor(this.battleState.playerAtk * (1 + totalSoulRecovered * 0.03));
        this.addBattleLog(`攻击力永久提高${totalSoulRecovered * 3}%`);
      }
      else if (skill.name === '百味入魂') {
        // 治疗自身7%最大生命值
        let healPercent = 7;
        // 每30点匠心额外治疗1%
        healPercent += Math.floor(this.battleState.jiangxinPoints / 30);
        // 星座三：匠心>=90时再额外治疗3%
        if (char.constellations[2]?.unlocked && this.battleState.jiangxinPoints >= 90) {
          healPercent += 3;
        }
        const heal = Math.floor(this.battleState.playerMaxHP * healPercent / 100);
        this.battleState.playerHP = Math.min(this.battleState.playerMaxHP, this.battleState.playerHP + heal);
        this.addBattleLog(`恢复${heal}点生命值`);
      }
      else if (skill.name === '万载宴飨') {
        // 进入【宴请八方】状态，持续2回合
        this.battleState.yanqingqingfangActive = true;
        this.battleState.yanqingqingfangTurns = 2;
        // 暴击率提高15%（或25%如果星座四解锁）
        const critBoost = char.constellations[3]?.unlocked ? 25 : 15;
        this.battleState.playerCritRate += critBoost - 15; // 调整实际提升
        this.addBattleLog(`进入【宴请八方】状态，暴击率提高${critBoost}%`);
      }
    }

    // 十方琉璃·宁荣荣的技能效果
    if (char.id === 'rongrong') {
      if (skill.name === '琉光·坚') {
        // 进入【流彩】状态，持续2回合
        this.battleState.liucaiActive = true;
        this.battleState.liucaiTurns = 2;
        // 最大生命值提高17%（或23%如果星座一解锁）
        const hpBoost = char.constellations[0]?.unlocked ? 0.23 : 0.17;
        const oldMaxHP = this.battleState.playerMaxHP;
        this.battleState.playerMaxHP = Math.floor(this.battleState.baseHP * (1 + hpBoost));
        this.battleState.playerHP = Math.min(this.battleState.playerHP + (this.battleState.playerMaxHP - oldMaxHP), this.battleState.playerMaxHP);
        this.addBattleLog(`进入【流彩】状态，最大生命值提高${hpBoost * 100}%`);
      }
      else if (skill.name === '琉光·华') {
        // 进入【舜光】状态，持续2回合
        this.battleState.shunguangActive = true;
        this.battleState.shunguangTurns = 2;
        // 攻击力提高17%（或23%如果星座二解锁）
        const atkBoost = char.constellations[1]?.unlocked ? 0.23 : 0.17;
        this.battleState.playerAtk = Math.floor(this.battleState.baseAtk * (1 + atkBoost));
        this.addBattleLog(`进入【舜光】状态，攻击力提高${atkBoost * 100}%`);
      }
      else if (skill.name === '琉璃心相') {
        // 恢复15%最大生命值
        const heal = Math.floor(this.battleState.playerMaxHP * 0.15);
        this.battleState.playerHP = Math.min(this.battleState.playerMaxHP, this.battleState.playerHP + heal);
        // 使敌方进入【琉璃】状态（1回合）
        this.applyDebuff('enemy', '琉璃');
        this.addBattleLog(`恢复${heal}点生命值，敌方进入【琉璃】状态`);
      }
      else if (skill.name === '一方澄照') {
        // 造成2段伤害，如果魂力>4则消耗所有魂力追加段数
        if (this.battleState.playerSoul + skill.cost > 4) {
          const extraHits = this.battleState.playerSoul + skill.cost - 4;
          // 这里已经在上面扣除了魂力，所以需要重新计算
          // 额外段数已经在伤害计算中体现
          this.addBattleLog(`追加${extraHits}段攻击！`);
        }
      }
    }
  }

  // 检查匠心满100的效果
  checkJiangxin() {
    if (this.battleState.jiangxinPoints >= 100) {
      const times = Math.floor(this.battleState.jiangxinPoints / 100);
      this.battleState.playerAtk = Math.floor(this.battleState.playerAtk * (1 + times * 0.15));
      this.addBattleLog(`【匠心】达到100点，攻击力永久提高${times * 15}%！`);
      this.battleState.jiangxinPoints = this.battleState.jiangxinPoints % 100;
    }
  }

  // 施加负面效果
  applyDebuff(target, effectName) {
    // 调整06215：彩彩四喜丸子意面施加的负面状态为1回合（状态自身为永久时长的除外）
    // 冰冻状态为永久，其他状态为1回合
    const effects = {
      '烧伤': { name: '烧伤', type: 'negative', desc: '每回合固定受到500点伤害', duration: 1 },
      '冰冻': { name: '冰冻', type: 'negative', desc: '无法行动，每回合70%概率移除', duration: -1 },
      '风化': { name: '风化', type: 'negative', desc: '每次造成伤害时固定受到300点伤害', duration: 1 },
      '琉璃': { name: '琉璃', type: 'negative', desc: '无法行动，下一回合移除并固定受到130%攻击力的伤害（或200%如果星座四解锁）', duration: 1 }
    };

    const effect = effects[effectName];
    if (!effect) return;

    // 玻璃状态的伤害倍率
    if (effectName === '琉璃') {
      const char = this.selectedCharacter;
      effect.damageMultiplier = char.id === 'rongrong' && char.constellations[3]?.unlocked ? 2 : 1.3;
    }

    if (target === 'enemy') {
      if (!this.battleState.enemyDebuffs) this.battleState.enemyDebuffs = [];
      // 如果已经存在同名效果，不重复添加（但冰冻可以叠加判断）
      if (!this.battleState.enemyDebuffs.find(e => e.name === effectName)) {
        this.battleState.enemyDebuffs.push({ ...effect });
      }
    } else {
      if (!this.battleState.playerDebuffs.find(e => e.name === effectName)) {
        this.battleState.playerDebuffs.push({ ...effect });
      }
    }
  }

  // 处理回合开始的效果
  processTurnStartEffects() {
    // 美食效果：四喜丸子意面 - 每回合开始额外获得1点魂力
    if (this.battleDishes.some(d => d.name.includes('四喜丸子意面') || d.name.includes('彩彩') || d.name.includes('清新'))) {
      this.battleState.playerSoul = Math.min(6, this.battleState.playerSoul + 1);
      this.addBattleLog(`【四喜丸子意面】效果：获得1点魂力`);

      // 彩彩效果：获得彩味层数
      if (this.battleDishes.some(d => d.name.includes('彩彩'))) {
        this.battleState.caiweiStacks++;
        this.addBattleLog(`获得1层【彩味】，当前${this.battleState.caiweiStacks}层`);
      }

      // 清新效果：移除随机负面效果
      if (this.battleDishes.some(d => d.name.includes('清新'))) {
        if (this.battleState.playerDebuffs.length > 0) {
          const randomIndex = Math.floor(Math.random() * this.battleState.playerDebuffs.length);
          const removed = this.battleState.playerDebuffs.splice(randomIndex, 1)[0];
          this.addBattleLog(`【清新四喜丸子意面】移除【${removed.name}】效果`);
          // 味道评分每有100，额外永久增加10%攻击力
          const tasteScore = this.battleDishes.find(d => d.name.includes('清新'))?.taste || 0;
          const atkBonus = Math.floor(tasteScore / 100) * 0.10;
          if (atkBonus > 0) {
            this.battleState.playerAtk = Math.floor(this.battleState.playerAtk * (1 + atkBonus));
            this.addBattleLog(`攻击力额外提高${atkBonus * 100}%`);
          }
        }
      }
    }

    // 美食效果：蛋包饭 - 每回合恢复5%生命值
    if (this.battleDishes.some(d => d.name.includes('蛋包饭') || d.name.includes('酥脆'))) {
      const heal = Math.floor(this.battleState.playerMaxHP * 0.05);
      this.battleState.playerHP = Math.min(this.battleState.playerMaxHP, this.battleState.playerHP + heal);
      this.addBattleLog(`【蛋包饭】效果：恢复${heal}点生命值`);
    }

    // 非经典蛋包饭：每回合提高10%攻击力
    if (this.battleDishes.some(d => d.name.includes('非经典'))) {
      const atkIncrease = Math.floor(this.battleState.playerAtk * 0.1);
      this.battleState.playerAtk += atkIncrease;
      this.addBattleLog(`【非经典蛋包饭】效果：攻击力提高${atkIncrease}`);
    }

    // 团圆全肉环香煲：每累计消耗5点魂力，攻击力提高10%
    if (this.battleDishes.some(d => d.name.includes('团圆'))) {
      const times = Math.floor(this.battleState.totalSoulConsumed / 5);
      if (times > 0 && this.battleState.lastSoulMilestone !== times) {
        this.battleState.lastSoulMilestone = times;
        const atkBoost = 10 + Math.floor((this.battleDishes.find(d => d.name.includes('团圆'))?.color || 0) / 100) * 7;
        this.battleState.playerAtk = Math.floor(this.battleState.playerAtk * (1 + atkBoost / 100));
        this.addBattleLog(`【团圆全肉环香煲】累计消耗${this.battleState.totalSoulConsumed}魂力，攻击力提高${atkBoost}%`);
      }
    }

    // 醇香全肉环香煲：每损失1000点生命值，攻击力提高10%
    if (this.battleDishes.some(d => d.name.includes('醇香'))) {
      const lostHP = this.battleState.baseHP - this.battleState.playerHP;
      const times = Math.floor(lostHP / 1000);
      if (times > 0 && this.battleState.lastHPLossMilestone !== times) {
        this.battleState.lastHPLossMilestone = times;
        const tasteScore = this.battleDishes.find(d => d.name.includes('醇香'))?.taste || 0;
        const atkBoost = 10 + Math.floor(tasteScore / 100) * 7;
        this.battleState.playerAtk = Math.floor(this.battleState.playerAtk * (1 + atkBoost / 100));
        this.addBattleLog(`【醇香全肉环香煲】损失${lostHP}生命值，攻击力提高${atkBoost}%`);
      }
    }

    // 减少角色专属状态持续时间
    this.reduceSpecialEffectDuration();

    // 烧伤效果：每回合受到500点伤害
    const burn = this.battleState.playerDebuffs.find(e => e.name === '烧伤');
    if (burn) {
      this.battleState.playerHP -= 500;
      this.showDamageNumber('player', 500, false);
      this.addBattleLog(`【烧伤】效果：受到500点伤害！`);
    }

    // 敌方烧伤
    if (this.battleState.enemyDebuffs) {
      const enemyBurn = this.battleState.enemyDebuffs.find(e => e.name === '烧伤');
      if (enemyBurn) {
        this.battleState.enemyHP -= 500;
        this.showDamageNumber('enemy', 500, false);
        this.addBattleLog(`敌方【烧伤】效果：受到500点伤害！`);
      }
    }

    // 减少负面状态持续时间
    this.reduceDebuffDuration();
  }

  // 减少角色专属状态持续时间
  reduceSpecialEffectDuration() {
    if (this.battleState.yanqingqingfangTurns > 0) {
      this.battleState.yanqingqingfangTurns--;
      if (this.battleState.yanqingqingfangTurns <= 0) {
        this.battleState.yanqingqingfangActive = false;
        this.addBattleLog(`【宴请八方】状态结束`);
      }
    }

    if (this.battleState.liucaiTurns > 0) {
      this.battleState.liucaiTurns--;
      if (this.battleState.liucaiTurns <= 0) {
        this.battleState.liucaiActive = false;
        this.addBattleLog(`【流彩】状态结束`);
      }
    }

    if (this.battleState.shunguangTurns > 0) {
      this.battleState.shunguangTurns--;
      if (this.battleState.shunguangTurns <= 0) {
        this.battleState.shunguangActive = false;
        this.addBattleLog(`【舜光】状态结束`);
      }
    }
  }

  // 速度判定：每回合开始时双方从速度范围内随机选数字，大的先行动
  doSpeedCheck() {
    const playerSpeed = this.battleState.playerSpeed.min + Math.random() * (this.battleState.playerSpeed.max - this.battleState.playerSpeed.min);
    const enemySpeed = this.battleState.enemySpeed.min + Math.random() * (this.battleState.enemySpeed.max - this.battleState.enemySpeed.min);

    this.battleState.playerActedFirst = playerSpeed >= enemySpeed;
    this.addBattleLog(`速度判定：你${Math.floor(playerSpeed)} VS 敌方${Math.floor(enemySpeed)}，${this.battleState.playerActedFirst ? '你先行动' : '敌方先行动'}！`);
  }

  // 减少负面状态持续时间
  reduceDebuffDuration() {
    // 彩彩四喜丸子意面施加的负面状态为1回合（除了冰冻）
    if (this.battleState.enemyDebuffs) {
      this.battleState.enemyDebuffs = this.battleState.enemyDebuffs.map(e => {
        if (e.duration > 0) {
          return { ...e, duration: e.duration - 1 };
        }
        return e;
      }).filter(e => e.duration > 0 || e.duration === -1); // -1表示永久
    }

    if (this.battleState.playerDebuffs) {
      this.battleState.playerDebuffs = this.battleState.playerDebuffs.map(e => {
        if (e.duration > 0) {
          return { ...e, duration: e.duration - 1 };
        }
        return e;
      }).filter(e => e.duration > 0 || e.duration === -1);
    }
  }

  enemyTurn() {
    // 检查敌方是否处于【琉璃】状态
    const liuli = this.battleState.enemyDebuffs?.find(e => e.name === '琉璃');
    if (liuli) {
      // 【琉璃】状态：无法行动，受到伤害
      const damage = Math.floor(this.battleState.playerAtk * (liuli.damageMultiplier || 1.3));
      this.battleState.enemyHP -= damage;
      this.showDamageNumber('enemy', damage, false);
      this.addBattleLog(`敌方处于【琉璃】状态，受到${damage}点伤害！`);
      // 移除琉璃状态
      this.battleState.enemyDebuffs = this.battleState.enemyDebuffs.filter(e => e.name !== '琉璃');
      this.updateStatusPanels();

      if (this.battleState.enemyHP <= 0) {
        setTimeout(() => this.endBattle(true), 500);
        return;
      }
      this.startNewTurn();
      return;
    }

    // 敌方被冰冻时跳过
    if (this.battleState.enemyDebuffs && this.battleState.enemyDebuffs.find(e => e.name === '冰冻')) {
      this.addBattleLog(`敌方被冰冻，无法行动！`);
      if (Math.random() < 0.7) {
        this.battleState.enemyDebuffs = this.battleState.enemyDebuffs.filter(e => e.name !== '冰冻');
        this.addBattleLog(`敌方冰冻效果已解除！`);
      }
      this.updateStatusPanels();
      this.startNewTurn();
      return;
    }

    // 敌人随机使用技能
    const skills = this.battleState.enemyChar.skills;
    const skill = skills[Math.floor(Math.random() * skills.length)];

    // 计算敌人暴击
    const isCrit = Math.random() * 100 < (this.battleState.enemyChar.stats.critRate || 10);
    let damage = Math.floor(this.battleState.enemyAtk * (1 + Math.random() * 0.2));
    if (isCrit) {
      damage = Math.floor(damage * ((this.battleState.enemyChar.stats.critDmg || 150) / 100));
    }

    this.battleState.playerHP -= damage;

    // 显示伤害数字动画 - 调整06215
    this.showDamageNumber('player', damage, isCrit);

    const critText = isCrit ? '【暴击】' : '';
    this.addBattleLog(`${critText}${this.battleState.enemyChar.name} 使用 ${skill.name}，造成 ${damage} 点伤害！`);

    this.updateHPBars();

    if (this.battleState.playerHP <= 0) {
      setTimeout(() => this.endBattle(false), 500);
      return;
    }

    this.startNewTurn();
  }

  startNewTurn() {
    // 恢复魂力
    this.battleState.playerSoul = Math.min(6, this.battleState.playerSoul + 2);

    // 新回合
    this.battleState.turn++;

    // 速度判定 - 调整06215：每回合开始时，双方角色从自身速度值范围内随机选定一个数字，数字大的本回合优先行动
    this.doSpeedCheck();

    // 处理回合开始效果
    this.processTurnStartEffects();

    // 计算美食加成
    this.calculateDishBonus();

    // 更新UI
    this.updateHPBars();
    this.updateStatusPanels();
    document.getElementById('soul-value').textContent = this.battleState.playerSoul;

    this.generateBattleSkills();

    // 如果敌方先行动，则自动执行敌人回合
    if (!this.battleState.playerActedFirst) {
      setTimeout(() => this.enemyTurn(), 1000);
    }
  }

  addBattleLog(text) {
    const log = document.getElementById('battle-log');
    const p = document.createElement('p');
    p.textContent = `[回合${this.battleState.turn}] ${text}`;
    p.style.margin = '5px 0';
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
  }

  endBattle(isWin) {
    if (isWin) {
      // 版本1.3更新：难度奖励调整
      const drillReward = this.calculateDifficultyBonus();
      this.drill += drillReward;
      this.showAlert(`战斗胜利！获得${drillReward}钻研`);
      this.saveCurrentAccount();
    } else {
      this.showAlert('战斗失败');
    }
    // 清空战斗日志
    document.getElementById('battle-log').innerHTML = '';
    this.showScreen('hall');
  }

  // ========== 珍馐陈设 ==========

  renderDisplayScreen() {
    const grid = document.getElementById('display-grid');
    grid.innerHTML = '';

    // 显示玩家获得的美食（从账号数据中读取）
    if (this.currentAccount && this.accounts[this.currentAccount]) {
      const accountData = this.accounts[this.currentAccount];

      // 如果有保存的美食数据，显示它们
      if (accountData.dishes && accountData.dishes.length > 0) {
        accountData.dishes.forEach(dishData => {
          const item = document.createElement('div');
          item.className = 'display-item';
          item.style.position = 'relative';
          // 添加放大镜按钮
          item.innerHTML = `
            <button class="magnifier-btn" title="查看战斗增益">🔍</button>
            <img src="assets/images/${dishData.img}" alt="${dishData.name}">
            <div class="display-item-name">${dishData.name}</div>
            <div class="display-item-score">总评分: ${dishData.score}</div>
          `;
          item.addEventListener('click', (e) => {
            // 如果点击的是放大镜按钮，显示战斗增益
            if (e.target.classList.contains('magnifier-btn')) {
              this.showSavedDishBonusDetail(dishData);
            } else {
              this.selectDisplayItem(dishData);
            }
          });
          grid.appendChild(item);
        });
      } else {
        // 如果没有美食数据，显示提示（横着居中）
        grid.innerHTML = '<div class="display-empty-text">暂无美食，请先在佳肴精研中烹饪美食</div>';
      }
    } else {
      grid.innerHTML = '<div class="display-empty-text">请先登录账号</div>';
    }

    // 加载已装备的美食
    this.loadEquippedDishes();

    // 绑定返回按钮
    document.getElementById('btn-back-display').onclick = () => {
      this.showScreen('hall');
    };

    // 绑定装备按钮
    document.getElementById('btn-equip-dish').onclick = () => {
      this.equipDish();
    };
  }

  // 加载已装备的美食
  loadEquippedDishes() {
    if (this.currentAccount && this.accounts[this.currentAccount]) {
      const savedEquipped = this.accounts[this.currentAccount].equippedDishes || {};
      this.equippedDishes = savedEquipped;

      // 渲染装备槽位
      const slots = document.querySelectorAll('.display-slot:not(.locked)');
      slots.forEach(slot => {
        const slotNum = slot.dataset.slot;
        if (savedEquipped[slotNum]) {
          const dishData = savedEquipped[slotNum];
          slot.innerHTML = `
            <img src="assets/images/${dishData.img}" alt="${dishData.name}">
            <div class="display-slot-name">${dishData.name}</div>
            <div class="display-slot-score">评分:${dishData.score}</div>
          `;
          slot.classList.add('equipped');
          slot.dataset.dishName = dishData.name;
          slot.addEventListener('click', () => this.selectSlot(slotNum));
        } else {
          slot.innerHTML = '';
          slot.classList.remove('equipped');
          slot.dataset.dishName = '';
        }
      });
    }
  }

  // 选择槽位
  selectSlot(slotNum) {
    this.selectedSlot = slotNum;
    document.querySelectorAll('.display-slot').forEach(s => s.classList.remove('selected'));
    document.querySelector(`.display-slot[data-slot="${slotNum}"]`).classList.add('selected');

    // 如果槽位有美食，显示移除按钮
    if (this.equippedDishes[slotNum]) {
      document.getElementById('btn-remove-dish').style.display = 'inline-block';
    } else {
      document.getElementById('btn-remove-dish').style.display = 'none';
    }
  }

  // 移除装备的美食
  removeEquippedDish() {
    if (!this.selectedSlot) {
      this.showAlert('请先选择一个槽位');
      return;
    }

    if (this.equippedDishes[this.selectedSlot]) {
      delete this.equippedDishes[this.selectedSlot];

      // 更新槽位显示
      const slot = document.querySelector(`.display-slot[data-slot="${this.selectedSlot}"]`);
      slot.innerHTML = '';
      slot.classList.remove('equipped');
      slot.dataset.dishName = '';

      // 保存到账号
      this.saveEquippedDishes();

      document.getElementById('btn-remove-dish').style.display = 'none';
      this.selectedSlot = null;
      this.showAlert('已移除美食');
    }
  }

  // 保存装备数据
  saveEquippedDishes() {
    if (this.currentAccount) {
      this.accounts[this.currentAccount].equippedDishes = this.equippedDishes;
      this.saveAllAccounts();
    }
  }

  // 显示已保存美食的战斗增益详情
  showSavedDishBonusDetail(dishData) {
    // 根据美食名字找到对应的增益数据
    let bonusData = null;
    Object.values(DISH_BONUSES).forEach(bonus => {
      if (bonus.name === dishData.name || dishData.name.includes(bonus.name)) {
        bonusData = bonus;
      }
      // 检查进化分支
      if (bonus.branches) {
        Object.values(bonus.branches).forEach(branch => {
          if (branch.name === dishData.name) {
            bonusData = bonus;
          }
        });
      }
    });

    if (!bonusData) {
      this.showAlert('暂无战斗增益数据');
      return;
    }

    document.getElementById('dish-bonus-name').textContent = dishData.name;
    document.getElementById('dish-bonus-img').src = `assets/images/${dishData.img}`;

    // 显示评分信息
    document.getElementById('dish-bonus-stats').innerHTML = `
      <p><strong>色泽评分：</strong>${dishData.color}</p>
      <p><strong>味道评分：</strong>${dishData.taste}</p>
      <p><strong>品质评分：</strong>${dishData.quality}</p>
      <p><strong>总评分：</strong>${dishData.score}</p>
    `;

    // 显示效果
    let effectsHtml = '';

    // 判断是否是进化版本
    const isEvolved = dishData.name !== bonusData.name;
    if (!isEvolved) {
      // 本源美食
      effectsHtml = `<div class="dish-bonus-effect-item"><strong>本源效果：</strong>${bonusData.effect}</div>`;
    } else {
      // 进化美食 - 显示进化效果
      if (bonusData.branches) {
        Object.values(bonusData.branches).forEach(branch => {
          if (branch.name === dishData.name) {
            effectsHtml = `<div class="dish-bonus-effect-item"><strong>进化效果：</strong>${branch.effect}</div>`;
            // 同时显示本源效果
            effectsHtml += `<div class="dish-bonus-effect-item"><strong>本源效果：</strong>${bonusData.effect}</div>`;
          }
        });
      }
    }

    document.getElementById('dish-bonus-effects').innerHTML = `<h4>战斗增益效果</h4>${effectsHtml}`;
    document.getElementById('dish-bonus-modal').classList.add('active');
  }

  selectDisplayItem(dish) {
    this.selectedDisplayDish = dish;
    document.querySelectorAll('.display-item').forEach(i => i.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
  }

  equipDish() {
    if (!this.selectedDisplayDish) {
      this.showAlert('请先选择一个美食');
      return;
    }

    // 检查是否已经装备过这个美食
    const dishName = this.selectedDisplayDish.name;
    for (let slotNum in this.equippedDishes) {
      if (this.equippedDishes[slotNum].name === dishName) {
        this.showAlert('该美食已经装备在其他槽位，每个美食只能装备一次！');
        return;
      }
    }

    // 找到空的槽位
    const slots = document.querySelectorAll('.display-slot:not(.locked)');
    for (const slot of slots) {
      const slotNum = slot.dataset.slot;
      if (!this.equippedDishes[slotNum]) {
        this.equippedDishes[slotNum] = this.selectedDisplayDish;

        slot.innerHTML = `
          <img src="assets/images/${this.selectedDisplayDish.img}" alt="${this.selectedDisplayDish.name}">
          <div class="display-slot-name">${this.selectedDisplayDish.name}</div>
          <div class="display-slot-score">评分:${this.selectedDisplayDish.score}</div>
        `;
        slot.classList.add('equipped');
        slot.dataset.dishName = this.selectedDisplayDish.name;
        slot.addEventListener('click', () => this.selectSlot(slotNum));

        // 保存到账号
        this.saveEquippedDishes();

        this.showAlert(`已装备 ${this.selectedDisplayDish.name}`);
        this.selectedDisplayDish = null;
        document.querySelectorAll('.display-item').forEach(i => i.classList.remove('selected'));
        return;
      }
    }

    this.showAlert('没有空槽位了');
  }

  // ========== 厨神修炼 ==========

  renderTrainingScreen() {
    const charList = document.getElementById('training-char-list');
    charList.innerHTML = '';

    // 获取账号解锁的角色
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};

    Object.values(CHARACTERS).forEach(char => {
      const isUnlocked = unlockedChars[char.id]?.unlocked || false;
      const card = document.createElement('div');
      // 调整06219：未解锁的角色也能查看，只是选择栏变暗
      card.className = `char-card ${isUnlocked ? '' : 'locked'}`;
      card.innerHTML = `
        <img src="assets/images/${char.avatar}" alt="${char.name}" style="${isUnlocked ? '' : 'filter: grayscale(100%); opacity: 0.5;'}">
        <div class="char-card-name">${char.quality}<br>${char.name}</div>
        ${isUnlocked ? '' : '<div style="font-size:12px;color:#999;">未解锁</div>'}
      `;
      // 调整06219：所有角色都可以点击查看（包括未解锁的）
      card.addEventListener('click', () => this.showCharacterDetail(char));
      charList.appendChild(card);
    });

    // 绑定返回按钮
    document.getElementById('btn-back-training').onclick = () => {
      this.showScreen('hall');
    };

    // 绑定标签切换
    document.querySelectorAll('.char-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.char-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.showCharTab(tab.dataset.tab);
      });
    });

    // 默认显示第一个角色
    this.showCharacterDetail(Object.values(CHARACTERS)[0]);
  }

  showCharacterDetail(char) {
    this.viewingCharacter = char;
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};
    const isUnlocked = unlockedChars[char.id]?.unlocked || false;

    document.getElementById('training-char-img').src = `assets/images/${char.portrait}`;
    document.getElementById('training-friendship').textContent = isUnlocked ? (unlockedChars[char.id]?.friendship || 0) : 0;

    // 显示角色属性
    const statsArea = document.getElementById('char-stats-area');
    if (statsArea && char.stats) {
      statsArea.innerHTML = `
        <div style="font-weight:bold;color:#8B4513;margin-bottom:10px;font-size:16px;">角色属性</div>
        <div style="color:#333;line-height:1.8;">
          <div>品质: <span style="color:#ffa500;font-weight:bold;">${char.quality}</span></div>
          <div>生命值: ${char.stats.hp}</div>
          <div>攻击力: ${char.stats.atk}</div>
          <div>暴击率: ${char.stats.critRate}%</div>
          <div>暴击伤害: ${char.stats.critDmg}%</div>
          <div>速度: ${char.stats.speed.min}-${char.stats.speed.max}</div>
        </div>
        ${isUnlocked ? '' : '<div style="margin-top:10px;padding:10px;background:#fff8dc;border-radius:8px;color:#8B4513;font-weight:bold;">该角色尚未解锁</div>'}
      `;
    }

    // 更新选中状态
    document.querySelectorAll('#training-char-list .char-card').forEach(c => c.classList.remove('selected'));
    event?.currentTarget?.classList.add('selected');

    // 获取当前激活的标签页，如果没有则默认为技能
    const activeTab = document.querySelector('.char-tab.active');
    const currentTabName = activeTab ? activeTab.dataset.tab : 'skills';
    this.showCharTab(currentTabName);
  }

  showCharTab(tabName) {
    const content = document.getElementById('char-tab-content');
    const char = this.viewingCharacter;
    if (!char) return;

    switch (tabName) {
      case 'skills':
        let skillsHtml = char.skills.map(s => `
          <div style="background:white;padding:15px;border-radius:10px;margin-bottom:10px;border-left:3px solid #8B4513;">
            <div style="font-weight:bold;color:#8B4513;font-size:16px;">${s.name}</div>
            <div style="font-size:14px;color:#666;margin-top:5px;">消耗魂力: ${s.cost}</div>
            <div style="font-size:13px;color:#333;margin-top:8px;line-height:1.5;">${s.desc}</div>
          </div>
        `).join('');
        // 添加技能专属效果 - 调整06215要求在厨神修炼中写明技能专属效果的具体内容
        if (char.skillEffects && char.skillEffects.length > 0) {
          skillsHtml += `
            <div style="background:#fff8dc;padding:15px;border-radius:10px;margin-top:15px;border-left:3px solid #ffa500;">
              <div style="font-weight:bold;color:#ffa500;font-size:16px;margin-bottom:10px;">技能专属效果说明</div>
              ${char.skillEffects.map(e => `<div style="font-size:14px;color:#666;margin-bottom:8px;line-height:1.5;">• ${e}</div>`).join('')}
            </div>
          `;
        }
        content.innerHTML = skillsHtml;
        break;

      case 'constellation':
        content.innerHTML = char.constellations.map(c => `
          <div style="background:white;padding:15px;border-radius:10px;margin-bottom:10px;opacity:${c.unlocked ? 1 : 0.5};border-left:3px solid ${c.unlocked ? '#ffa500' : '#ccc'};">
            <div style="font-weight:bold;color:#8B4513;font-size:16px;">${c.name}</div>
            <div style="font-size:14px;color:#666;margin-top:5px;line-height:1.5;">${c.effect}</div>
            <div style="font-size:12px;color:${c.unlocked ? '#4CAF50' : '#999'};margin-top:8px;">${c.unlocked ? '已解锁' : '未解锁'}</div>
          </div>
        `).join('');
        break;

      case 'experience':
        content.innerHTML = `
          <div style="text-align:center;padding:30px;background:white;border-radius:10px;">
            <div style="font-size:18px;color:#8B4513;font-weight:bold;margin-bottom:15px;">佳肴精研天赋</div>
            <div style="font-size:15px;color:#666;line-height:1.6;">${char.cookingBonus}</div>
          </div>
        `;
        break;

      case 'bond':
        content.innerHTML = `
          <div style="background:white;padding:15px;border-radius:10px;margin-bottom:10px;">
            ${char.stories.map(s => `
              <div style="padding:15px;border-bottom:1px solid #eee;">
                <div style="color:${s.unlocked ? '#8B4513' : '#999'};font-weight:bold;font-size:16px;">${s.title}</div>
                <div style="font-size:12px;color:#999;margin-top:5px;">好感度 ${s.requireLevel} 级解锁</div>
                ${s.unlocked && s.content !== '暂未开放' ? `<div style="font-size:14px;color:#333;margin-top:8px;">${s.content}</div>` : ''}
              </div>
            `).join('')}
            <div style="padding:15px;">
              <div style="color:${char.bond.unlocked ? '#8B4513' : '#999'};font-weight:bold;font-size:16px;">${char.bond.title}</div>
              <div style="font-size:12px;color:#999;margin-top:5px;">好感度 ${char.bond.requireLevel} 级解锁</div>
            </div>
          </div>
        `;
        break;
    }
  }

  // ========== 公告系统 ==========
  initNoticeSystem() {
    document.getElementById('btn-notice').addEventListener('click', () => {
      this.showNoticeModal();
    });
    document.getElementById('notice-close').addEventListener('click', () => {
      document.getElementById('notice-modal').classList.remove('active');
    });
    document.getElementById('notice-detail-back').addEventListener('click', () => {
      document.getElementById('notice-detail').style.display = 'none';
      document.getElementById('notice-list').style.display = 'block';
    });
  }

  showNoticeModal() {
    document.getElementById('notice-detail').style.display = 'none';
    document.getElementById('notice-list').style.display = 'block';
    this.renderNoticeList();
    document.getElementById('notice-modal').classList.add('active');
  }

  renderNoticeList() {
    const list = document.getElementById('notice-list');
    list.innerHTML = '';

    NOTICES.forEach(notice => {
      const item = document.createElement('div');
      item.className = 'notice-item';
      item.innerHTML = `
        <div class="notice-item-title">${notice.title}</div>
        <div class="notice-item-date">${notice.date}</div>
      `;
      item.addEventListener('click', () => this.showNoticeDetail(notice));
      list.appendChild(item);
    });
  }

  showNoticeDetail(notice) {
    document.getElementById('notice-list').style.display = 'none';
    document.getElementById('notice-detail').style.display = 'block';
    document.getElementById('notice-detail-title').textContent = notice.title;
    document.getElementById('notice-detail-date').textContent = notice.date;
    document.getElementById('notice-detail-content').innerHTML = notice.content.replace(/\n/g, '<br>');
  }

  // ========== 邮件系统 ==========
  initMailSystem() {
    document.getElementById('btn-mail').addEventListener('click', () => {
      this.showMailModal();
    });
    document.getElementById('mail-close').addEventListener('click', () => {
      document.getElementById('mail-modal').classList.remove('active');
    });
    document.getElementById('mail-detail-back').addEventListener('click', () => {
      document.getElementById('mail-detail').style.display = 'none';
      document.getElementById('mail-list').style.display = 'block';
    });
    document.getElementById('btn-claim-mail').addEventListener('click', () => {
      this.claimMailAttachment();
    });
  }

  showMailModal() {
    document.getElementById('mail-detail').style.display = 'none';
    document.getElementById('mail-list').style.display = 'block';
    this.renderMailList();
    document.getElementById('mail-modal').classList.add('active');
  }

  renderMailList() {
    const list = document.getElementById('mail-list');
    list.innerHTML = '';

    // 调整062111：确保邮件列表正确显示
    const mails = this.accounts[this.currentAccount]?.mails || [];
    // 如果账号没有邮件，则初始化默认邮件
    if (mails.length === 0) {
      this.accounts[this.currentAccount].mails = JSON.parse(JSON.stringify(INITIAL_MAILS));
      this.saveAllAccounts();
      mails = this.accounts[this.currentAccount].mails;
    }

    mails.forEach(mail => {
      const item = document.createElement('div');
      item.className = 'mail-item';
      item.innerHTML = `
        <div class="mail-item-title">${mail.title}</div>
        <div class="mail-item-date">${mail.date}</div>
        ${mail.claimed ? '<span style="color:#4CAF50;font-size:12px;">已领取</span>' : ''}
      `;
      item.addEventListener('click', () => this.showMailDetail(mail));
      list.appendChild(item);
    });
  }

  showMailDetail(mail) {
    this.currentMail = mail;
    document.getElementById('mail-list').style.display = 'none';
    document.getElementById('mail-detail').style.display = 'block';
    document.getElementById('mail-detail-title').textContent = mail.title;
    document.getElementById('mail-detail-date').textContent = mail.date;
    document.getElementById('mail-detail-content').textContent = mail.content;

    // 调整062167：显示附件图案
    const attachmentsDiv = document.getElementById('mail-attachments');
    if (mail.attachments && mail.attachments.length > 0) {
      attachmentsDiv.innerHTML = '<strong>附件：</strong><br>';
      attachmentsDiv.style.display = 'block';
      mail.attachments.forEach(att => {
        // 检查是否是角色类型
        if (att.type === 'character') {
          const charData = CHARACTERS[att.id];
          if (charData) {
            attachmentsDiv.innerHTML += `
              <div style="display:flex;align-items:center;gap:10px;margin:10px 0;padding:10px;background:#f9f9f9;border-radius:8px;">
                <img src="assets/images/${charData.avatar}" style="width:40px;height:40px;object-fit:contain;border-radius:50%;">
                <span style="color:#ffa500;font-weight:bold;">${att.name}</span>
              </div>
            `;
          }
        } else if (att.item === 'drill') {
          // 钻研类型 - 特殊处理
          attachmentsDiv.innerHTML += `
            <div style="display:flex;align-items:center;gap:10px;margin:10px 0;padding:10px;background:#f9f9f9;border-radius:8px;">
              <img src="assets/images/货币 钻研.png" style="width:40px;height:40px;object-fit:contain;">
              <span>钻研 x${att.count}</span>
            </div>
          `;
        } else {
          const itemData = ITEMS[att.item];
          if (itemData) {
            attachmentsDiv.innerHTML += `
              <div style="display:flex;align-items:center;gap:10px;margin:10px 0;padding:10px;background:#f9f9f9;border-radius:8px;">
                <img src="assets/images/${itemData.img}" style="width:40px;height:40px;object-fit:contain;">
                <span>${itemData.name} x${att.count}</span>
              </div>
            `;
          }
        }
      });
      document.getElementById('btn-claim-mail').style.display = 'inline-block';
      // 调整06218：正确显示已领取状态
      document.getElementById('btn-claim-mail').disabled = mail.claimed;
      document.getElementById('btn-claim-mail').textContent = mail.claimed ? '✓ 已领取' : '领取附件';
    } else {
      attachmentsDiv.innerHTML = '无附件';
      document.getElementById('btn-claim-mail').style.display = 'none';
    }
  }

  claimMailAttachment() {
    if (!this.currentMail || this.currentMail.claimed) return;

    let rewardText = [];

    // 调整062111：正确处理不同类型的附件
    this.currentMail.attachments.forEach(att => {
      if (att.type === 'character') {
        // 角色类型附件 - 解锁角色
        console.log(`领取角色附件: ${att.id}, ${att.name}`);
        this.unlockCharacter(att.id);
        rewardText.push(att.name);
      } else if (att.item === 'drill') {
        // 钻研类型 - 直接添加到玩家钻研数量
        this.drill += att.count;
        this.updateDrillDisplay();
        rewardText.push(`钻研 x${att.count}`);
        console.log(`邮件领取钻研: x${att.count}, 当前钻研: ${this.drill}`);
      } else {
        // 道具类型附件 - 直接添加到账号数据
        const itemData = ITEMS[att.item];
        if (itemData) {
          // 确保items对象存在
          if (!this.accounts[this.currentAccount].items) {
            this.accounts[this.currentAccount].items = {};
          }
          // 添加道具
          this.accounts[this.currentAccount].items[att.item] =
            (this.accounts[this.currentAccount].items[att.item] || 0) + att.count;
          rewardText.push(`${itemData.name} x${att.count}`);
          console.log(`邮件领取道具: ${itemData.name} x${att.count}, 当前数量: ${this.accounts[this.currentAccount].items[att.item]}`);
        }
      }
    });

    // 标记已领取
    this.currentMail.claimed = true;

    // 调整062111：正确更新邮件数据
    const mailIndex = this.accounts[this.currentAccount].mails.findIndex(m => m.id === this.currentMail.id);
    if (mailIndex >= 0) {
      this.accounts[this.currentAccount].mails[mailIndex].claimed = true;
    }

    // 立即保存账号数据
    this.saveAllAccounts();

    // 更新按钮状态
    document.getElementById('btn-claim-mail').disabled = true;
    document.getElementById('btn-claim-mail').textContent = '✓ 已领取';

    // 领取成功提示
    this.showAlert(`领取成功！获得：${rewardText.join('、')}`);

    // 刷新邮件列表显示
    this.renderMailList();
  }

  // ========== 背包系统 ==========
  initBackpackSystem() {
    document.getElementById('btn-backpack').addEventListener('click', () => {
      this.showBackpackModal();
    });
    document.getElementById('backpack-close').addEventListener('click', () => {
      document.getElementById('backpack-modal').classList.remove('active');
    });
    document.getElementById('backpack-detail-back').addEventListener('click', () => {
      document.getElementById('backpack-detail').style.display = 'none';
      document.getElementById('backpack-list').style.display = 'block';
    });
    document.getElementById('btn-use-item').addEventListener('click', () => {
      this.useItem();
    });
  }

  showBackpackModal() {
    document.getElementById('backpack-detail').style.display = 'none';
    document.getElementById('backpack-list').style.display = 'block';
    this.renderBackpackList();
    document.getElementById('backpack-modal').classList.add('active');
  }

  renderBackpackList() {
    const list = document.getElementById('backpack-list');
    list.innerHTML = '';

    const items = this.accounts[this.currentAccount]?.items || {};

    Object.entries(items).forEach(([itemId, count]) => {
      if (count <= 0) return;
      const itemData = ITEMS[itemId];
      if (!itemData) return;

      // 调整06219：样式做成和食物图鉴容器一样，横着从上往下排列
      const item = document.createElement('div');
      item.className = 'backpack-item';
      item.innerHTML = `
        <img src="assets/images/${itemData.img}" alt="${itemData.name}">
        <div class="backpack-item-info">
          <div class="backpack-item-name">${itemData.name}</div>
          <div class="backpack-item-count">数量: ${count}</div>
          <div style="font-size:12px;color:#999;">${itemData.desc || ''}</div>
        </div>
      `;
      item.addEventListener('click', () => this.showBackpackDetail(itemId));
      list.appendChild(item);
    });

    if (list.innerHTML === '') {
      list.innerHTML = '<div style="text-align:center;color:#666;padding:30px;">背包暂无物品</div>';
    }
  }

  showBackpackDetail(itemId) {
    this.currentBackpackItem = itemId;
    const itemData = ITEMS[itemId];
    const count = this.accounts[this.currentAccount]?.items?.[itemId] || 0;

    document.getElementById('backpack-list').style.display = 'none';
    document.getElementById('backpack-detail').style.display = 'block';
    document.getElementById('backpack-detail-img').src = `assets/images/${itemData.img}`;
    document.getElementById('backpack-detail-name').textContent = itemData.name;
    document.getElementById('backpack-detail-count').textContent = `数量: ${count}`;
    document.getElementById('backpack-detail-desc').textContent = itemData.desc;

    // 显示或隐藏使用按钮
    document.getElementById('btn-use-item').style.display =
      (itemId === 'bondCrystal' || itemId === 'displaySlot') ? 'inline-block' : 'none';
  }

  useItem() {
    const itemId = this.currentBackpackItem;
    if (!itemId) return;

    const itemCount = this.accounts[this.currentAccount]?.items?.[itemId] || 0;
    if (itemCount <= 0) {
      this.showAlert('道具数量不足');
      return;
    }

    if (itemId === 'bondCrystal') {
      // 调整06219：使用结晶时先选择角色确认
      const unlockedChars = this.accounts[this.currentAccount]?.characters || {};
      const unlockedList = Object.entries(unlockedChars)
        .filter(([id, data]) => data.unlocked)
        .map(([id, data]) => {
          const charData = CHARACTERS[id];
          return `${charData?.name || id}`;
        });

      if (unlockedList.length === 0) {
        this.showAlert('暂无已解锁的厨神角色');
        return;
      }

      // 显示选择角色弹窗
      this.showBondCrystalSelectModal();
    }
    else if (itemId === 'displaySlot') {
      // 解锁珍馐陈设格子
      if (this.selectedDisplaySlot) {
        this.unlockDisplaySlot();
      } else {
        this.showAlert('请先在珍馐陈设中选择要解锁的格子');
        document.getElementById('backpack-modal').classList.remove('active');
      }
    }
    else if (itemId === 'invite') {
      this.showAlert('邀约需要在召唤界面使用');
    }
    else {
      this.showAlert('该道具暂无可使用功能');
    }
  }

  // 调整06219：显示结晶使用角色选择弹窗
  showBondCrystalSelectModal() {
    const unlockedChars = this.accounts[this.currentAccount]?.characters || {};
    const content = document.getElementById('backpack-detail');

    // 创建角色选择列表
    let charListHtml = '<div style="margin-top:15px;"><strong>选择要提升好感度的角色：</strong></div>';
    charListHtml += '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;">';

    Object.entries(unlockedChars).forEach(([id, data]) => {
      if (!data.unlocked) return;
      const charData = CHARACTERS[id];
      if (!charData) return;

      charListHtml += `
        <div class="bond-crystal-char-btn" data-char-id="${id}" style="padding:10px 15px;background:#fff8dc;border:2px solid #8B4513;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:10px;">
          <img src="assets/images/${charData.avatar}" style="width:40px;height:40px;object-fit:contain;border-radius:50%;">
          <span>${charData.name}</span>
        </div>
      `;
    });

    charListHtml += '</div>';
    content.innerHTML += charListHtml;

    // 绑定角色选择事件
    document.querySelectorAll('.bond-crystal-char-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const charId = btn.dataset.charId;
        this.useBondCrystal(charId);
        document.getElementById('backpack-modal').classList.remove('active');
      });
    });
  }

  // 使用结晶提升好感度
  useBondCrystal(charId) {
    const itemCount = this.accounts[this.currentAccount]?.items?.bondCrystal || 0;
    if (itemCount <= 0) {
      this.showAlert('情缘结晶数量不足');
      return;
    }

    const charData = CHARACTERS[charId];
    if (!charData) return;

    // 消耗结晶并提升好感度
    this.accounts[this.currentAccount].items.bondCrystal--;
    this.accounts[this.currentAccount].characters[charId].friendship += 2;
    this.saveCurrentAccount();

    this.showAlert(`使用了SP+厨神情缘结晶，${charData.name}好感度+2！`);
  }

  // ========== 召唤系统 ==========
  initSummonSystem() {
    document.getElementById('btn-summon').addEventListener('click', () => {
      this.showScreen('summon');
      this.renderSummonScreen();
    });
    document.getElementById('btn-back-summon').addEventListener('click', () => {
      this.showScreen('hall');
    });
    document.getElementById('btn-summon-1').addEventListener('click', () => {
      this.doSummon(1);
    });
    document.getElementById('btn-summon-10').addEventListener('click', () => {
      this.doSummon(10);
    });
    document.getElementById('btn-summon-rules').addEventListener('click', () => {
      this.showSummonRulesModal();
    });
    document.getElementById('btn-summon-record').addEventListener('click', () => {
      this.showSummonRecordModal();
    });
    document.getElementById('summon-rules-close').addEventListener('click', () => {
      document.getElementById('summon-rules-modal').classList.remove('active');
    });
    document.getElementById('summon-record-close').addEventListener('click', () => {
      document.getElementById('summon-record-modal').classList.remove('active');
    });
    document.getElementById('summon-results-confirm').addEventListener('click', () => {
      document.getElementById('summon-animation-screen').classList.remove('active');
      this.showScreen('summon');
      this.renderSummonScreen();
    });
  }

  renderSummonScreen() {
    // 显示邀约数量
    const inviteCount = this.accounts[this.currentAccount]?.items?.invite || 0;
    document.getElementById('invite-value').textContent = inviteCount;

    // 渲染卡池列表
    const poolsDiv = document.getElementById('summon-pools');
    poolsDiv.innerHTML = '';

    Object.values(SUMMON_POOLS).forEach(pool => {
      const btn = document.createElement('div');
      btn.className = `summon-pool-btn ${pool.id === this.currentPool?.id ? 'active' : ''}`;
      btn.innerHTML = `<img src="assets/images/${pool.btnImg}" alt="${pool.name}">`;
      // 调整06218：所有卡池都可以点击切换
      btn.addEventListener('click', () => this.selectPool(pool));
      poolsDiv.appendChild(btn);
    });

    // 默认选择第一个卡池
    if (!this.currentPool) {
      this.currentPool = Object.values(SUMMON_POOLS)[0];
    }
    this.selectPool(this.currentPool);
  }

  selectPool(pool) {
    this.currentPool = pool;

    // 更新海报
    document.getElementById('summon-poster').src = `assets/images/${pool.posterImg}`;

    // 更新时间 - 调整06218：移到右侧
    const timeDiv = document.getElementById('summon-time');
    if (pool.rewards && pool.progressRewards) {
      // 显示当前抽卡次数
      const summonCount = this.accounts[this.currentAccount]?.summonCounts?.[pool.id] || 0;
      const maxProgress = pool.guarantee || 400;
      timeDiv.innerHTML = `<div style="font-size:18px;font-weight:bold;margin-bottom:10px;">已抽 ${summonCount} / ${maxProgress} 次</div>`;
      if (pool.startTime && pool.startTime !== '未定') {
        timeDiv.innerHTML += `<div style="font-size:12px;color:#ccc;">${pool.startTime} - ${pool.endTime}</div>`;
      }
    } else {
      timeDiv.textContent = '卡池暂未开放';
    }

    // 更新进度条和累抽奖励显示 - 每次只显示一档
    if (pool.rewards && pool.progressRewards) {
      const summonCount = this.accounts[this.currentAccount]?.summonCounts?.[pool.id] || 0;
      const maxProgress = pool.guarantee || 400;
      document.getElementById('summon-progress-fill').style.width =
        `${Math.min(summonCount / maxProgress * 100, 100)}%`;

      // 累抽奖励显示 - 只显示当前档位（未达到的最近一档）
      const rewardsDiv = document.getElementById('summon-progress-rewards');
      rewardsDiv.innerHTML = '<div style="font-weight:bold;margin-bottom:8px;color:#ffa500;">累抽奖励：</div>';

      // 找到当前档位（下一个未领取的档位）
      const progressRewards = pool.progressRewards;
      const claimed = this.accounts[this.currentAccount]?.progressClaimed?.[pool.id] || [];
      let currentRewardIndex = -1;

      for (let i = 0; i < progressRewards.length; i++) {
        const r = progressRewards[i];
        if (summonCount < r.count || !claimed.includes(r.count)) {
          currentRewardIndex = i;
          break;
        }
      }

      // 如果所有档位都已领取，显示最后一档已领取状态
      if (currentRewardIndex === -1) {
        currentRewardIndex = progressRewards.length - 1;
      }

      const r = progressRewards[currentRewardIndex];
      const isClaimed = claimed.includes(r.count);
      const rewardText = r.rewards.map(rr => {
        if (rr.item) {
          const itemData = ITEMS[rr.item];
          return `${itemData?.name || rr.item} x${rr.count}`;
        }
        return '';
      }).join('、');

      rewardsDiv.innerHTML += `
        <div style="padding:12px;margin:8px 0;background:${isClaimed ? 'rgba(76,175,80,0.2)' : 'rgba(255,165,0,0.3)'};border-radius:8px;font-size:14px;border:2px solid ${isClaimed ? '#4CAF50' : '#ffa500'};">
          <span style="${isClaimed ? 'color:#4CAF50;' : 'color:#ffa500;font-weight:bold;'}">${r.count}抽</span>
          <span style="color:#fff;margin-left:15px;">${rewardText}</span>
          ${isClaimed ? '<span style="color:#4CAF50;margin-left:15px;">✓ 已领取</span>' : `<span style="color:#ccc;margin-left:15px;">（当前: ${summonCount}/${r.count}）</span>`}
        </div>
      `;

      // 如果全部领取完毕，显示提示
      if (claimed.length >= progressRewards.length) {
        rewardsDiv.innerHTML += '<div style="text-align:center;color:#4CAF50;margin-top:10px;">所有档位奖励已全部领取！</div>';
      }

      document.getElementById('summon-info').style.display = 'block';
    } else {
      document.getElementById('summon-info').style.display = 'none';
    }

    // 更新按钮状态 - 调整06218：碧落玉花卡池暂未开放
    const summonBtn1 = document.getElementById('btn-summon-1');
    const summonBtn10 = document.getElementById('btn-summon-10');
    if (!pool.rewards) {
      summonBtn1.disabled = true;
      summonBtn10.disabled = true;
      summonBtn1.textContent = '暂未开放';
      summonBtn10.textContent = '暂未开放';
    } else {
      summonBtn1.disabled = false;
      summonBtn10.disabled = false;
      summonBtn1.textContent = '召唤1次';
      summonBtn10.textContent = '召唤10次';
    }

    // 更新选中状态
    document.querySelectorAll('.summon-pool-btn').forEach(btn => btn.classList.remove('active'));
    event?.currentTarget?.classList.add('active');
  }

  showSummonRulesModal() {
    if (!this.currentPool) return;

    const rulesText = document.getElementById('summon-rules-text');
    rulesText.innerHTML = `
      <p><strong>卡池：${this.currentPool.name}</strong></p>
      <p>开启时间：${this.currentPool.startTime} - ${this.currentPool.endTime}</p>
      <br>
      <p><strong>召唤概率：</strong></p>
      <p>• B级奖励：80%</p>
      <p>• A级奖励：17%</p>
      <p>• S级奖励：2.8%</p>
      <p>• SP+级奖励：0.2%</p>
      <br>
      <p><strong>保底机制：</strong></p>
      <p>• 累计召唤350次后，每次召唤SP+概率提高1.5%</p>
      <p>• 累计召唤10次，必得A级以上</p>
      <p>• 累计召唤60次，必得S级以上</p>
      <p>• 累计召唤400次，必定获得${this.currentPool.spCharacter ? CHARACTERS[this.currentPool.spCharacter]?.name : '限定厨神'}</p>
    `;

    document.getElementById('summon-rules-modal').classList.add('active');
  }

  showSummonRecordModal() {
    const list = document.getElementById('summon-record-list');
    list.innerHTML = '';

    const records = this.accounts[this.currentAccount]?.summonRecords?.[this.currentPool?.id] || [];

    records.slice(-20).reverse().forEach(record => {
      const item = document.createElement('div');
      item.className = 'record-item';
      item.innerHTML = `
        <img src="assets/images/${record.img}" alt="${record.name}">
        <div class="record-item-info">
          <div class="record-item-name">${record.name}</div>
          <div class="record-item-rarity ${record.rarity}">${record.rarity}级</div>
        </div>
        <div style="font-size:12px;color:#666;">${record.date}</div>
      `;
      list.appendChild(item);
    });

    if (list.innerHTML === '') {
      list.innerHTML = '<div style="text-align:center;color:#666;padding:20px;">暂无召唤记录</div>';
    }

    document.getElementById('summon-record-modal').classList.add('active');
  }

  doSummon(count) {
    if (!this.currentPool) return;

    // 调整06218：碧落玉花卡池暂未开放，可查看海报但不能召唤
    if (this.currentPool.locked || !this.currentPool.rewards) {
      this.showAlert('该卡池暂未开放，敬请期待！');
      return;
    }

    // 调整062111：正确获取邀约数量
    if (!this.accounts[this.currentAccount].items) {
      this.accounts[this.currentAccount].items = {};
    }
    const inviteCount = this.accounts[this.currentAccount].items.invite || 0;

    console.log(`当前邀约数量: ${inviteCount}, 需要消耗: ${count}`);

    if (inviteCount < count) {
      // 调整062167：邀约数量不足时提示可用钻研兑换
      const needed = count - inviteCount;
      const drillCost = needed * 300;
      const currentDrill = this.drill || 0;
      if (currentDrill >= drillCost) {
        if (confirm(`邀约数量不足！是否使用${drillCost}钻研兑换${needed}个邀约？`)) {
          this.drill -= drillCost;
          // 直接添加邀约
          this.accounts[this.currentAccount].items.invite = inviteCount + needed;
          this.saveAllAccounts();
          this.updateDrillDisplay();
          // 继续召唤
          this.doSummon(count);
        }
      } else {
        this.showAlert(`邀约数量不足！需要${needed}个邀约，可用${drillCost}钻研兑换（当前钻研：${currentDrill}）`);
      }
      return;
    }

    // 调整062111：正确消耗邀约数量并立即保存
    this.accounts[this.currentAccount].items.invite -= count;
    console.log(`消耗${count}邀约后剩余: ${this.accounts[this.currentAccount].items.invite}`);

    // 执行抽卡
    const results = [];
    for (let i = 0; i < count; i++) {
      const result = this.singleSummon();
      if (result) {
        results.push(result);
      }
    }

    // 调整062111：正确保存召唤记录
    if (!this.accounts[this.currentAccount].summonRecords) {
      this.accounts[this.currentAccount].summonRecords = {};
    }
    if (!this.accounts[this.currentAccount].summonRecords[this.currentPool.id]) {
      this.accounts[this.currentAccount].summonRecords[this.currentPool.id] = [];
    }

    const now = new Date();
    results.forEach(r => {
      if (r) {
        this.accounts[this.currentAccount].summonRecords[this.currentPool.id].push({
          name: r.name,
          img: r.img,
          rarity: r.rarity,
          date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString()
        });
      }
    });

    console.log(`本次召唤记录: ${results.length}条`);

    // 更新召唤次数
    if (!this.accounts[this.currentAccount].summonCounts) {
      this.accounts[this.currentAccount].summonCounts = {};
    }
    this.accounts[this.currentAccount].summonCounts[this.currentPool.id] =
      (this.accounts[this.currentAccount].summonCounts[this.currentPool.id] || 0) + count;

    // 检查进度奖励
    this.checkSummonProgressRewards();

    // 调整062111：立即保存所有数据
    this.saveAllAccounts();

    // 显示召唤动画和结果
    this.showSummonAnimation(results);
  }

  singleSummon() {
    const pool = this.currentPool;
    if (!pool || !pool.rewards) {
      return null;
    }

    const summonCount = this.accounts[this.currentAccount]?.summonCounts?.[pool.id] || 0;

    // 计算概率（包含保底）
    let spChance = 0.2; // 0.2%
    if (summonCount >= 350) {
      spChance += (summonCount - 350) * 1.5;
    }
    // 400次保底
    if (summonCount >= 399) {
      spChance = 100;
    }

    let rand = Math.random() * 100;
    let rarity;

    if (rand < spChance) {
      rarity = 'SP';
    } else if (rand < spChance + 2.8) {
      rarity = 'S';
    } else if (rand < spChance + 2.8 + 17) {
      rarity = 'A';
    } else {
      rarity = 'B';
    }

    // 根据稀有度获取奖励
    let reward;
    if (rarity === 'SP' && pool.spCharacter) {
      // 获得角色
      const charId = pool.spCharacter;
      reward = {
        type: 'character',
        id: charId,
        name: CHARACTERS[charId]?.name || '角色',
        img: CHARACTERS[charId]?.avatar || '',
        rarity: 'SP'
      };
      // 解锁角色（如果未拥有则解锁，否则解锁星座）
      this.unlockCharacter(charId);
      console.log(`获取限定厨神 ${charId}！`);
    } else {
      // 获得道具 - 调整06219：正确保存道具到背包
      const rewards = pool.rewards?.[rarity] || [];
      const selectedReward = rewards[Math.floor(Math.random() * rewards.length)];
      if (selectedReward) {
        if (selectedReward.character) {
          reward = {
            type: 'character',
            id: selectedReward.character,
            name: CHARACTERS[selectedReward.character]?.name || '角色',
            img: CHARACTERS[selectedReward.character]?.avatar || '',
            rarity: rarity
          };
          this.unlockCharacter(selectedReward.character);
        } else {
          // 调整06219：正确添加道具到背包并保存
          this.addItem(selectedReward.item, selectedReward.count);
          this.saveCurrentAccount();
          reward = {
            type: 'item',
            id: selectedReward.item,
            name: ITEMS[selectedReward.item]?.name || selectedReward.item,
            img: ITEMS[selectedReward.item]?.img || '',
            rarity: rarity
          };
        }
      } else {
        // 如果没有对应奖励，默认给宝石
        const defaultReward = { item: 'gemJunior', count: 3 };
        this.addItem(defaultReward.item, defaultReward.count);
        this.saveCurrentAccount();
        reward = {
          type: 'item',
          id: defaultReward.item,
          name: ITEMS[defaultReward.item]?.name || '辅助系初级宝石',
          img: ITEMS[defaultReward.item]?.img || '',
          rarity: rarity
        };
      }
    }

    return reward;
  }

  unlockCharacter(charId) {
    console.log(`解锁角色: ${charId}`);

    if (!this.accounts[this.currentAccount].characters) {
      this.accounts[this.currentAccount].characters = {};
    }

    if (!this.accounts[this.currentAccount].characters[charId] ||
        !this.accounts[this.currentAccount].characters[charId].unlocked) {
      // 新获得角色或解锁已存在的角色
      this.accounts[this.currentAccount].characters[charId] = {
        unlocked: true,
        friendship: 0,
        starStone: 50,  // 首次获得赠送50星石
        constellations: CHARACTERS[charId]?.constellations?.map(c => ({ ...c, unlocked: false })) || []
      };
      console.log(`角色 ${charId} 已解锁!`);
    } else {
      // 重复获得，增加星石
      this.accounts[this.currentAccount].characters[charId].starStone += 50;
      console.log(`角色 ${charId} 已拥有，获得50星石`);

      // 检查是否可以解锁星座
      const charData = this.accounts[this.currentAccount].characters[charId];
      const unlockedCount = charData.constellations?.filter(c => c.unlocked).length || 0;
      if (charData.starStone >= 50 && unlockedCount < 4) {
        charData.starStone -= 50;
        charData.constellations[unlockedCount].unlocked = true;
        console.log(`解锁星座 ${unlockedCount + 1}`);
      }
    }

    // 立即保存
    this.saveAllAccounts();
  }

  checkSummonProgressRewards() {
    const pool = this.currentPool;
    const summonCount = this.accounts[this.currentAccount]?.summonCounts?.[pool.id] || 0;
    const claimed = this.accounts[this.currentAccount]?.progressClaimed?.[pool.id] || [];

    pool.progressRewards?.forEach(r => {
      if (summonCount >= r.count && !claimed.includes(r.count)) {
        r.rewards.forEach(rr => {
          this.addItem(rr.item, rr.count);
        });
        claimed.push(r.count);
        this.accounts[this.currentAccount].progressClaimed = {
          ...this.accounts[this.currentAccount].progressClaimed,
          [pool.id]: claimed
        };
        this.showAlert(`累计召唤${r.count}次，获得奖励！`);
      }
    });
  }

  showSummonAnimation(results) {
    document.getElementById('summon-screen').classList.remove('active');
    document.getElementById('summon-animation-screen').classList.add('active');

    // 显示动画
    document.getElementById('summon-animation').style.display = 'block';
    document.getElementById('summon-results').style.display = 'none';
    document.getElementById('summon-results-confirm').style.display = 'none';

    // 2秒后显示结果
    setTimeout(() => {
      document.getElementById('summon-animation').style.display = 'none';
      document.getElementById('summon-results').style.display = 'flex';
      document.getElementById('summon-results-confirm').style.display = 'block';

      const resultsDiv = document.getElementById('summon-results');
      resultsDiv.innerHTML = '';

      results.forEach(r => {
        const item = document.createElement('div');
        item.className = `summon-result-item ${r.rarity}`;
        item.innerHTML = `
          <img src="assets/images/${r.img}" alt="${r.name}">
          <div style="font-weight:bold;margin-top:10px;">${r.name}</div>
          <div style="font-size:12px;color:#666;">${r.rarity}级</div>
        `;
        resultsDiv.appendChild(item);
      });
    }, 2000);
  }

  // ========== 道具管理 ==========
  addItem(itemId, count) {
    if (!this.accounts[this.currentAccount]) {
      console.error('账号数据不存在');
      return;
    }
    if (!this.accounts[this.currentAccount].items) {
      this.accounts[this.currentAccount].items = {};
    }
    // 调整062110：确保正确添加道具并保存
    this.accounts[this.currentAccount].items[itemId] =
      (this.accounts[this.currentAccount].items[itemId] || 0) + count;
    console.log(`添加道具: ${itemId} x${count}, 当前数量: ${this.accounts[this.currentAccount].items[itemId]}`);
  }

  // ========== 每日登录奖励 ==========
  checkDailyLoginReward() {
    const today = new Date().toDateString();
    const lastLogin = this.accounts[this.currentAccount]?.lastLoginDate || '';

    console.log(`检查每日登录: 今天=${today}, 上次登录=${lastLogin}`);

    if (lastLogin !== today) {
      // 调整062111：每日首次登录 - 邀约正确记录到背包并持久化保存
      if (!this.accounts[this.currentAccount].items) {
        this.accounts[this.currentAccount].items = {};
      }
      this.accounts[this.currentAccount].items.invite =
        (this.accounts[this.currentAccount].items.invite || 0) + 1;
      this.accounts[this.currentAccount].lastLoginDate = today;

      // 立即保存到localStorage
      this.saveAllAccounts();
      console.log(`每日登录奖励已保存, 邀约数量: ${this.accounts[this.currentAccount].items.invite}`);

      this.showAlert('每日首次登录，获得邀约x1！已存入背包');
    }
  }

  // ========== 解锁珍馐陈设格子 ==========
  initUnlockSlotSystem() {
    document.getElementById('unlock-slot-close').addEventListener('click', () => {
      document.getElementById('unlock-slot-modal').classList.remove('active');
    });
    document.getElementById('btn-confirm-unlock-slot').addEventListener('click', () => {
      this.confirmUnlockSlot();
    });

    // 点击锁定的格子
    document.querySelectorAll('.display-slot.locked').forEach(slot => {
      slot.addEventListener('click', () => {
        this.selectedDisplaySlot = slot.dataset.slot;
        document.getElementById('unlock-slot-modal').classList.add('active');
      });
    });
  }

  confirmUnlockSlot() {
    if (!this.selectedDisplaySlot) return;

    const slotCount = this.accounts[this.currentAccount]?.items?.displaySlot || 0;
    if (slotCount <= 0) {
      this.showAlert('珍馐藏品格数量不足！');
      document.getElementById('unlock-slot-modal').classList.remove('active');
      return;
    }

    // 消耗格子道具
    this.accounts[this.currentAccount].items.displaySlot--;

    // 解锁格子
    const slot = document.querySelector(`.display-slot[data-slot="${this.selectedDisplaySlot}"]`);
    slot.classList.remove('locked');
    slot.innerHTML = '';
    slot.textContent = '';

    this.accounts[this.currentAccount].unlockedSlots =
      [...(this.accounts[this.currentAccount].unlockedSlots || []), this.selectedDisplaySlot];

    this.saveCurrentAccount();
    document.getElementById('unlock-slot-modal').classList.remove('active');
    this.showAlert('格子已解锁！');
    this.selectedDisplaySlot = null;
  }

  // ========== 邀约兑换 ==========
  initExchangeSystem() {
    document.getElementById('exchange-close').addEventListener('click', () => {
      document.getElementById('exchange-modal').classList.remove('active');
    });
    document.getElementById('exchange-count').addEventListener('input', (e) => {
      document.getElementById('exchange-cost').textContent = parseInt(e.target.value) * 300;
    });
    document.getElementById('btn-confirm-exchange').addEventListener('click', () => {
      this.confirmExchange();
    });
  }

  showExchangeModal() {
    document.getElementById('exchange-modal').classList.add('active');
  }

  confirmExchange() {
    const count = parseInt(document.getElementById('exchange-count').value) || 1;
    const cost = count * 300;

    if (this.drill < cost) {
      this.showAlert('钻研数量不足！');
      return;
    }

    this.drill -= cost;
    this.addItem('invite', count);
    this.saveCurrentAccount();
    this.updateDrillDisplay();

    document.getElementById('exchange-modal').classList.remove('active');
    this.showAlert(`成功兑换${count}个邀约！`);
  }

  // ========== 更新角色选择立绘 ==========
  updateCharacterSelectPortrait(char) {
    // 使用新的选择立绘图片
    if (char.id === 'rongrong') {
      document.getElementById('char-preview-img').src = 'assets/images/十方琉璃宁荣荣选择立绘.png';
    } else if (char.id === 'oscar') {
      document.getElementById('char-preview-img').src = 'assets/images/太初奥斯卡选择立绘.png';
    } else {
      document.getElementById('char-preview-img').src = `assets/images/${char.portrait}`;
    }
  }

  // ========== 难度奖励调整 ==========
  calculateDifficultyBonus() {
    const baseDrill = 50;
    const multiplier = this.difficultyMultiplier || 1;
    const bonusPercent = Math.floor((multiplier - 1) * 10); // 每100%增加10%
    return Math.floor(baseDrill * (1 + bonusPercent / 100));
  }

  // ========== 修复敌人美食显示 ==========
  updateEnemyDishPanel() {
    const enemyDishList = document.getElementById('enemy-dish-list');
    enemyDishList.innerHTML = '';

    if (this.enemyDishes && this.enemyDishes.length > 0) {
      this.enemyDishes.forEach(dish => {
        const div = document.createElement('div');
        div.className = 'dish-icon';
        div.innerHTML = `<img src="assets/images/${dish.img}" alt="${dish.name}">`;
        div.addEventListener('click', () => this.showBattleDishDetail(dish));
        enemyDishList.appendChild(div);
      });
    } else {
      enemyDishList.innerHTML = '<div style="color:#666;font-size:11px;text-align:center;padding:10px;">未装备美食</div>';
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});