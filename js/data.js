/**
 * 一食定天 - 游戏数据
 */

// 美食数据（最终菜品）
const DISHES = {
  meatStew: {
    id: 'meatStew',
    name: '全肉环香煲',
    img: '美食 全肉环香煲.png',
    desc: '肉香四溢的杂合煲，色泽鲜美，酱汁丰富，十分吸引人胃口',
    branches: [
      { name: '团圆全肉环香煲', condition: '在烹饪中累计获得三次团圆饺子', unlocked: false },
      { name: '醇香全肉环香煲', condition: '在烹饪中累计获得三次牛排块', unlocked: false },
      { name: '流溢全肉环香煲', condition: '在烹饪中累计获得一次极-牛排块，一次极-柠檬羊排', unlocked: false }
    ]
  },
  fourJoyPasta: {
    id: 'fourJoyPasta',
    name: '四喜丸子意面',
    img: '美食 四喜丸子意面.png',
    desc: '某人大胆创新的结果，却也是意想不到的美味组合',
    branches: [
      { name: '彩彩四喜丸子意面', condition: '在烹饪中累积获得三次彩椒丸子', unlocked: false },
      { name: '清新四喜丸子意面', condition: '在烹饪中累积获得三次蔬菜棒', unlocked: false },
      { name: '???', condition: '该分支暂未解锁', unlocked: false }
    ]
  },
  omurice: {
    id: 'omurice',
    name: '蛋包饭',
    img: '美食 蛋包饭.png',
    desc: '一道经典的老少皆宜美食，每一个吃过蛋包饭的人都赞不绝口',
    branches: [
      { name: '非经典蛋包饭', condition: '在烹饪中累计获得一次青草提拉米苏', unlocked: false },
      { name: '酥脆蛋包饭', condition: '在烹饪中累积获得三次黄金虾球', unlocked: false },
      { name: '???', condition: '该分支暂未解锁', unlocked: false }
    ]
  }
};

// 食材数据
const INGREDIENTS = {
  // 主食类
  pineappleCheese: {
    id: 'pineappleCheese',
    name: '菠萝奶酪块',
    img: '菠萝奶酪块.png',
    type: 'side', // 配食
    stats: {
      good: { color: 30, taste: 20, quality: 30 },
      great: { color: 40, taste: 25, quality: 35 },
      perfect: { color: 45, taste: 30, quality: 43 }
    }
  },
  pepperBall: {
    id: 'pepperBall',
    name: '彩椒丸子',
    img: '彩椒丸子.png',
    type: 'side', // 配食
    stats: {
      good: { color: 20, taste: 40, quality: 30 },
      great: { color: 27, taste: 45, quality: 30 },
      perfect: { color: 35, taste: 55, quality: 40 }
    }
  },
  goldenShrimp: {
    id: 'goldenShrimp',
    name: '黄金虾球',
    img: '黄金虾球.png',
    type: 'side', // 配食
    stats: {
      good: { color: 30, taste: 40, quality: 20 },
      great: { color: 35, taste: 45, quality: 25 },
      perfect: { color: 50, taste: 60, quality: 30 }
    }
  },
  duckMeat: {
    id: 'duckMeat',
    name: '酱鸭肉',
    img: '酱鸭肉.png',
    type: 'staple',
    stats: {
      good: { color: 20, taste: 30, quality: 20 },
      great: { color: 25, taste: 35, quality: 25 },
      perfect: { color: 35, taste: 40, quality: 30 }
    }
  },
  goldenChicken: {
    id: 'goldenChicken',
    name: '金黄鸡腿',
    img: '金黄鸡腿.png',
    type: 'staple',
    stats: {
      good: { color: 30, taste: 40, quality: 35 },
      great: { color: 35, taste: 50, quality: 35 },
      perfect: { color: 45, taste: 60, quality: 40 }
    }
  },
  corn: {
    id: 'corn',
    name: '烤玉米',
    img: '烤玉米.png',
    type: 'side', // 配食
    stats: {
      good: { color: 30, taste: 30, quality: 40 },
      great: { color: 35, taste: 35, quality: 45 },
      perfect: { color: 40, taste: 40, quality: 50 }
    }
  },
  mashedPotato: {
    id: 'mashedPotato',
    name: '满满土豆泥',
    img: '满满土豆泥.png',
    type: 'staple',
    stats: {
      good: { color: 40, taste: 40, quality: 40 },
      great: { color: 45, taste: 45, quality: 45 },
      perfect: { color: 50, taste: 50, quality: 50 }
    }
  },
  lambChop: {
    id: 'lambChop',
    name: '柠檬羊排',
    img: '柠檬羊排.png',
    type: 'staple',
    stats: {
      good: { color: 30, taste: 30, quality: 35 },
      great: { color: 35, taste: 33, quality: 40 },
      perfect: { color: 40, taste: 45, quality: 42 }
    }
  },
  beefSteak: {
    id: 'beefSteak',
    name: '牛排块',
    img: '牛排块.png',
    type: 'staple',
    stats: {
      good: { color: 40, taste: 40, quality: 40 },
      great: { color: 45, taste: 47, quality: 40 },
      perfect: { color: 50, taste: 60, quality: 50 }
    }
  },
  dumpling: {
    id: 'dumpling',
    name: '团圆饺子',
    img: '团圆饺子.png',
    type: 'staple',
    stats: {
      good: { color: 35, taste: 40, quality: 30 },
      great: { color: 40, taste: 45, quality: 30 },
      perfect: { color: 45, taste: 55, quality: 40 }
    }
  },
  porkChop: {
    id: 'porkChop',
    name: '炸猪排',
    img: '炸猪排.png',
    type: 'staple',
    stats: {
      good: { color: 40, taste: 50, quality: 40 },
      great: { color: 45, taste: 55, quality: 45 },
      perfect: { color: 50, taste: 65, quality: 50 }
    }
  },
  // 甜品类
  grassTiramisu: {
    id: 'grassTiramisu',
    name: '青草提拉米苏',
    img: '青草提拉米苏.png',
    type: 'side', // 配食
    stats: {
      good: { color: 50, taste: 35, quality: 15 },
      great: { color: 55, taste: 40, quality: 20 },
      perfect: { color: 55, taste: 55, quality: 25 }
    }
  },
  sushi: {
    id: 'sushi',
    name: '三和寿司',
    img: '三和寿司.png',
    type: 'staple', // 主食
    stats: {
      good: { color: 25, taste: 40, quality: 25 },
      great: { color: 30, taste: 45, quality: 31 },
      perfect: { color: 40, taste: 55, quality: 40 }
    }
  },
  // 配食类
  sugarCoated: {
    id: 'sugarCoated',
    name: '糖葫芦',
    img: '糖葫芦.png',
    type: 'side', // 配食
    stats: {
      good: { color: 25, taste: 25, quality: 25 },
      great: { color: 30, taste: 30, quality: 27 },
      perfect: { color: 40, taste: 40, quality: 40 }
    }
  },
  vegetableStick: {
    id: 'vegetableStick',
    name: '蔬菜棒',
    img: '蔬菜棒.png',
    type: 'side',
    stats: {
      good: { color: 30, taste: 30, quality: 40 },
      great: { color: 35, taste: 35, quality: 45 },
      perfect: { color: 40, taste: 40, quality: 50 }
    }
  }
};

// 食材类型名称
const INGREDIENT_TYPES = {
  staple: '主食',
  side: '配食'
};

// 厨具数据
const TOOLS = {
  noodleMaker: {
    id: 'noodleMaker',
    name: '面条机',
    img: '面条机.png',
    type: 'common', // 普通
    effect: '本局品质属性永久提高0.5%',
    effectType: 'quality',
    effectValue: 0.5
  },
  waterHeater: {
    id: 'waterHeater',
    name: '热水壶',
    img: '热水壶.png',
    type: 'common',
    effect: '本局味道属性永久提高0.5%',
    effectType: 'taste',
    effectValue: 0.5
  },
  weighingScale: {
    id: 'weighingScale',
    name: '称重机',
    img: '称重机.png',
    type: 'common',
    effect: '本局色泽属性永久提高0.5%',
    effectType: 'color',
    effectValue: 0.5
  },
  whisk: {
    id: 'whisk',
    name: '打发机',
    img: '打发机.png',
    type: 'rare', // 优秀
    effect: '本局品质属性永久提高1%',
    effectType: 'quality',
    effectValue: 1
  },
  coffeeMachine: {
    id: 'coffeeMachine',
    name: '咖啡机',
    img: '咖啡机.png',
    type: 'rare',
    effect: '本局味道属性永久提高1%',
    effectType: 'taste',
    effectValue: 1
  },
  toaster: {
    id: 'toaster',
    name: '烤面包机',
    img: '烤面包机.png',
    type: 'rare',
    effect: '本局色泽属性永久提高1%',
    effectType: 'color',
    effectValue: 1
  },
  distiller: {
    id: 'distiller',
    name: '蒸馏机',
    img: '蒸馏机.png',
    type: 'legendary', // 极品
    effect: '每经过一个关卡获得20点精力',
    effectType: 'energy',
    effectValue: 20
  },
  riceCooker: {
    id: 'riceCooker',
    name: '至尊电饭煲',
    img: '至尊电饭煲.png',
    type: 'legendary',
    effect: '所有精力消耗降低10%',
    effectType: 'discount',
    effectValue: 10
  }
};

// 技能数据
const SKILLS = {
  skill1: {
    id: 'skill1',
    name: '拾味众生',
    desc: '开局时可额外获得随机一个良食材，有概率获得佳或极品质',
    levels: [1, 1.2, 1.5, 1.8, 2],
    costs: [20, 35, 50, 80]
  },
  skill2: {
    id: 'skill2',
    name: '精讲技巧',
    desc: '所有精力消耗降低',
    levels: [2, 2.5, 3.5, 5, 7],
    costs: [20, 35, 50, 80]
  },
  skill3: {
    id: 'skill3',
    name: '太初奇运',
    desc: '在选择中刷出极品质食物的概率提高',
    levels: [5, 7, 9, 11, 15],
    costs: [20, 35, 50, 80]
  },
  skill4: {
    id: 'skill4',
    name: '天然相成',
    desc: '每获得一种不同食物，美食最终评分提高',
    levels: [5, 8, 11, 14, 20],
    costs: [20, 35, 50, 80]
  }
};

// 故事文本
const STORIES = [
  '清晨的阳光洒在厨房，新鲜的食材正等着你去发现...',
  '远处的山上，传说有珍贵的食材生长在那里...',
  '集市上传来了热闹的叫卖声，也许能淘到好东西...',
  '森林深处的小溪边，据说有珍稀的蘑菇...',
  '老农夫的菜地里，新鲜的蔬菜正等着采摘...',
  '山间的果园飘来阵阵果香，诱人极了...',
  '河边的渔民刚捕到新鲜的鱼虾...',
  '草原上的牧民送来了上好的牛羊...'
];

// 对话文本（更新）
const CHATS = [
  '哇，这个食材看起来真不错！',
  '继续加油，我们的美食会越来越好的！',
  '嗯，闻到了美味的气息...',
  '这个搭配一定很棒！',
  '今天的收获满满啊！',
  '我觉得我们的菜品会越来越出色！',
  '这个厨具帮了大忙了！',
  '再来点食材就完美了！'
];

// 角色数据
const CHARACTERS = {
  oscar: {
    id: 'oscar',
    name: '太初食神·奥斯卡',
    quality: 'SP+',
    avatar: '太初奥斯卡头像.png',
    portrait: '太初奥斯卡立绘.png',
    chibi: '太初奥斯卡q版立绘.png',
    stats: {
      hp: 47228,
      atk: 2441,
      critRate: 80,
      critDmg: 680,
      speed: { min: 120, max: 130 }
    },
    skills: [
      {
        name: '五味归无',
        cost: 3,
        desc: '造成3段278%攻击力的伤害并恢复自身2点魂力值，自身获得10点【匠心】'
      },
      {
        name: '太初有余',
        cost: 0,
        desc: '恢复1点魂力，当前自身每拥有50点【匠心】，额外恢复1点。每恢复1点魂力时，本场战斗自身攻击力永久提高3%'
      },
      {
        name: '百味入魂',
        cost: 1,
        desc: '造成170%攻击力的伤害，并治疗自身7%最大生命值，每有30点【匠心】，额外治疗1%'
      },
      {
        name: '万载宴飨',
        cost: 3,
        desc: '使自身进入持续2回合的【宴请八方】，暴击率提高15%，释放技能时，每消耗1点魂力，使最终伤害提高10%'
      }
    ],
    skillEffects: [
      '【匠心】：每获得100点，本场战斗自身攻击力永久提高15%，然后清空点数',
      '【宴请八方】：持续2回合，暴击率提高15%（星座四解锁后25%），释放技能时每消耗1点魂力，最终伤害提高10%（星座四解锁后20%）'
    ],
    constellations: [
      { name: '余味回流', effect: '技能【五味归无】获得的【匠心】提高至15点', unlocked: false },
      { name: '精火以算', effect: '攻击力提高20%', unlocked: false },
      { name: '锦衣华食', effect: '技能【百味入魂】追加效果，若当前拥有【匠心】大于等于90点，再额外治疗3%', unlocked: false },
      { name: '御馔滋尝', effect: '技能【万载宴飨】暴击率提高至25%，最终伤害提高20%', unlocked: false }
    ],
    stories: [
      { title: '简史一：掌以火候', content: '暂未开放', unlocked: false, requireLevel: 2 },
      { title: '简史二：待以心萃', content: '暂未开放', unlocked: false, requireLevel: 5 },
      { title: '简史三：成以胸怀', content: '暂未开放', unlocked: false, requireLevel: 7 }
    ],
    bond: { title: '佳缘：不抵此难', content: '暂未开放', unlocked: false, requireLevel: 10 },
    cookingBonus: '初始精力增加300，每获得一件极品质食物获得70点精力',
    starStone: 0,
    friendship: 0
  },
  rongrong: {
    id: 'rongrong',
    name: '十方琉璃·宁荣荣',
    quality: 'SP+',
    avatar: '十方琉璃宁荣荣头像.png',
    portrait: '十方琉璃宁荣荣全身立绘.png',
    chibi: '十方琉璃宁荣荣q版立绘.png',
    stats: {
      hp: 40957,
      atk: 2693,
      critRate: 70,
      critDmg: 500,
      speed: { min: 124, max: 128 }
    },
    skills: [
      {
        name: '琉光·坚',
        cost: 2,
        desc: '造成207%攻击力的伤害，自身进入持续2回合的【流彩】。同时存在【流彩】和【舜光】时，额外提高暴击伤害50%'
      },
      {
        name: '琉光·华',
        cost: 2,
        desc: '造成2段158%攻击力的伤害，自身进入持续2回合的【舜光】。同时存在【流彩】和【舜光】时，额外提高暴击伤害50%'
      },
      {
        name: '琉璃心相',
        cost: 0,
        desc: '恢复自身15%最大生命值，使敌方进入持续1回合的【琉璃】状态'
      },
      {
        name: '一方澄照',
        cost: 4,
        desc: '造成2段230%攻击力的伤害，若释放时魂力大于4点，则消耗所有魂力，每多消耗1点追加1段攻击'
      }
    ],
    skillEffects: [
      '【流彩】：持续2回合，最大生命值提高17%（星座一解锁后23%）。同时存在【流彩】和【舜光】时，额外提高暴击伤害50%',
      '【舜光】：持续2回合，攻击力提高17%（星座二解锁后23%）。同时存在【流彩】和【舜光】时，额外提高暴击伤害50%',
      '【琉璃】：持续1回合，持有该状态时无法行动，下一回合移除并固定受到施加者130%攻击力的伤害（星座四解锁后200%）'
    ],
    constellations: [
      { name: '琉璃天泽', effect: '【流彩】使最大生命值提高至23%', unlocked: false },
      { name: '万法归宁', effect: '【舜光】使攻击力提高至23%', unlocked: false },
      { name: '纯然晶芒', effect: '暴击伤害提高100%', unlocked: false },
      { name: '流光溢彩', effect: '【琉璃】状态造成的伤害提高至200%攻击力', unlocked: false }
    ],
    stories: [
      { title: '简史一：掌心光', content: '暂未开放', unlocked: false, requireLevel: 2 },
      { title: '简史二：眉间彩', content: '暂未开放', unlocked: false, requireLevel: 5 },
      { title: '简史三：身侧月', content: '暂未开放', unlocked: false, requireLevel: 7 }
    ],
    bond: { title: '佳缘：瑶光隙游', content: '暂未开放', unlocked: false, requireLevel: 10 },
    cookingBonus: '暂无特殊效果',
    starStone: 0,
    friendship: 0
  }
};

// 美食增益数据（用于珍馐陈设和战斗）
const DISH_BONUSES = {
  meatStew: {
    id: 'meatStew',
    name: '全肉环香煲',
    img: '美食 全肉环香煲.png',
    effect: '每经过2个回合，攻击力永久提高10%。总评分每有1000，再提高10%',
    branches: {
      '团圆全肉环香煲': {
        name: '团圆全肉环香煲',
        effect: '每累计消耗5点魂力，攻击力永久提高10%。色泽评分每有100，再提高7%'
      },
      '醇香全肉环香煲': {
        name: '醇香全肉环香煲',
        effect: '每损失1000点生命值，攻击力永久提高10%。味道评分每有100，再提高7%'
      },
      '流溢全肉环香煲': {
        name: '流溢全肉环香煲',
        effect: '每次造成伤害自身获得1层【香溢】，每层永久提高攻击力13%，品质评分每有100，再提高5%'
      }
    }
  },
  fourJoyPasta: {
    id: 'fourJoyPasta',
    name: '四喜丸子意面',
    img: '美食 四喜丸子意面.png',
    effect: '每回合开始时额外获得1点魂力',
    branches: {
      '彩彩四喜丸子意面': {
        name: '彩彩四喜丸子意面',
        effect: '每获得1点魂力，自身获得1层【彩味】，角色造成伤害时，消耗1层对敌方施加【烧伤】【冰冻】【风化】中的随机一种效果，色泽评分每有100，触发该效果时增加5%概率不消耗【彩味】'
      },
      '清新四喜丸子意面': {
        name: '清新四喜丸子意面',
        effect: '每获得1点魂力，可移除自身随机1种负面效果，味道评分每有100，触发进化效果时本场战斗额外永久增加10%攻击力'
      }
    }
  },
  omurice: {
    id: 'omurice',
    name: '蛋包饭',
    img: '美食 蛋包饭.png',
    effect: '每回合恢复5%最大生命值',
    branches: {
      '非经典蛋包饭': {
        name: '非经典蛋包饭',
        effect: '生命值永久降低20%，每回合提高攻击力10%，味道评分每有100，降低的生命值减少3%'
      },
      '酥脆蛋包饭': {
        name: '酥脆蛋包饭',
        effect: '每累计恢复10%最大生命值，攻击力提高8%，品质评分每有100，再提高3%'
      }
    }
  }
};

// 状态效果数据
const STATUS_EFFECTS = {
  burn: { name: '烧伤', desc: '每回合固定受到500点伤害', type: 'negative' },
  frozen: { name: '冰冻', desc: '无法行动，每回合70%概率移除', type: 'negative' },
  windErosion: { name: '风化', desc: '每次造成伤害时固定受到300点伤害', type: 'negative' }
};

// 道具数据
const ITEMS = {
  invite: {
    id: 'invite',
    name: '邀约',
    img: '货币 邀约.png',
    desc: '用于召唤争夺厨神之路的伙伴，是稀缺的货币',
    type: 'currency'
  },
  drill: {
    id: 'drill',
    name: '钻研',
    img: '货币 钻研.png',
    desc: '进修过程中必不可少的货币，可以用于升级技能树或兑换邀约',
    type: 'currency'
  },
  gemJunior: {
    id: 'gemJunior',
    name: '辅助系初级宝石',
    img: '辅助系初级宝石.png',
    desc: '晶莹剔透的宝石，暂未开放功能',
    type: 'material'
  },
  gemMiddle: {
    id: 'gemMiddle',
    name: '辅助系中级宝石',
    img: '辅助系中级宝石.png',
    desc: '晶莹剔透发光的宝石，暂未开放功能',
    type: 'material'
  },
  gemSenior: {
    id: 'gemSenior',
    name: '辅助系高级宝石',
    img: '辅助系高级宝石.png',
    desc: '晶莹剔透发光闪亮的宝石，暂未开放功能',
    type: 'material'
  },
  bondCrystal: {
    id: 'bondCrystal',
    name: 'SP+厨神情缘结晶',
    img: 'SP+厨神情缘结晶.png',
    desc: '一物证情，此身期许。可用于提升厨神的好感度',
    type: 'material'
  },
  displaySlot: {
    id: 'displaySlot',
    name: '珍馐藏品格',
    img: '珍馐藏品格.png',
    desc: '世间百味皆纳入其中，可用于增加珍馐陈设的美食摆放容量上限',
    type: 'material'
  }
};

// 卡池数据
const SUMMON_POOLS = {
  liuli: {
    id: 'liuli',
    name: '琉璃映光',
    btnImg: '琉璃映光卡池按钮.png',
    posterImg: '十方琉璃宁荣荣卡池海报.png',
    startTime: '2026年6月21日',
    endTime: '未定',
    limited: true,
    spCharacter: 'rongrong',
    rewards: {
      B: [{ item: 'gemJunior', count: 3 }],
      A: [{ item: 'gemMiddle', count: 3 }],
      S: [
        { item: 'gemSenior', count: 1 },
        { item: 'bondCrystal', count: 1 }
      ],
      SP: [{ character: 'rongrong' }]
    },
    progressRewards: [
      { count: 60, rewards: [{ item: 'invite', count: 10 }] },
      { count: 150, rewards: [{ item: 'invite', count: 15 }] },
      { count: 230, rewards: [{ item: 'bondCrystal', count: 1 }] },
      { count: 320, rewards: [{ item: 'displaySlot', count: 1 }] }
    ],
    guarantee: 400
  },
  biluo: {
    id: 'biluo',
    name: '碧落玉花',
    btnImg: '碧落玉花卡池按钮.png',
    posterImg: '十方琉璃宁荣荣皮肤碧落玲珑卡池海报.png.jpg',
    startTime: '未定',
    endTime: '未定',
    limited: true,
    locked: false  // 调整06218：可以点击切换
  }
};

// 公告数据
const NOTICES = [
  {
    id: 1,
    title: '限时召唤:琉璃映光 开启',
    date: '2026年6月21日',
    content: `各位食旅客大家好！6月21日版本更新后，限时召唤:琉璃映光正式开启
本次卡池为限时卡池，具体规则如下：
每一次召唤均可获得随机奖励，
单次召唤产出概率如下：B级 80%  A级 17%  S级 2.8%  SP+级 0.2%
当玩家在同一个池子中累计召唤350次，之后每进行一次抽取，获得SP+级奖励的概率提高1.5%，产出其余级别奖励的概率降低
每累计召唤10次，必得A级以上奖励
每累计召唤60次，必得S级以上奖励
当召唤次数累计达到400次时，必定获得当期限定厨神
卡池结束后，十方琉璃·宁荣荣将暂时无法获得`
  },
  {
    id: 2,
    title: '一食定天1.3版本正式上线！',
    date: '2026年6月21日',
    content: `各位食旅客大家好！欢迎您踏上这条争夺厨神之路，在一食定天内，你可以选择自由搭配食物和厨具做出属于自己的美食，也可以选择心仪的厨神参加对战活动。
本次更新，游戏的大部分基础玩法已经实装，接下来是内容播报：
开启"厨神修炼"功能：厨神是食旅客必不可少的伙伴，获得厨神后，他们可以在"佳肴精研"和"常胜斗擂"玩法中上阵，并带来不同的增益效果和战斗效果
开启"常胜斗擂"功能：在该功能中玩家可以选择与人机对战或加入房间与其他玩家1V1，当玩家获胜时，可以获得一定量的"钻研"
开启"珍馐陈设"功能：玩家在"佳肴精研"中制作的美食将会有不同的增益效果，在此功能中装配上，可以为战斗带来更强的帮助
开启邮件功能
开启卡池召唤功能
最后，祝各位食旅客在厨神之路上终得所愿！`
  }
];

// 初始邮件
const INITIAL_MAILS = [
  {
    id: 1,
    title: '公测奖励',
    date: '2026年6月21日',
    content: '感谢食旅客的支持，以下是公测奖励，请查收！',
    attachments: [
      { item: 'invite', count: 30 },
      { item: 'bondCrystal', count: 1 }
    ],
    claimed: false
  },
  {
    id: 2,
    title: '公测追加奖励',
    date: '2026年6月21日',
    content: '感谢食旅客的支持，公测追加奖励：太初食神·奥斯卡已加入您的角色列表！',
    attachments: [
      { type: 'character', id: 'oscar', name: '太初食神·奥斯卡' }
    ],
    claimed: false
  },
  {
    id: 3,
    title: '公测祝福奖励',
    date: '2026年6月21日',
    content: '为了食旅客的游玩愉快，现追加福利赠送！',
    attachments: [
      { item: 'drill', count: 120000 }
    ],
    claimed: false
  }
];