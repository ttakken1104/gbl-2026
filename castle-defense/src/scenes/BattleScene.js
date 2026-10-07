import { createGameTextures } from '../utils/TextureGenerator.js';

export class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  create() {
    // 텍스처 준비
    createGameTextures(this);

    // 게임 상태 변수
    this.castleMaxHp = 100;
    this.castleHp = this.castleMaxHp;
    this.gold = 0;
    this.maxAmmo = 3;
    this.ammo = this.maxAmmo;
    this.ammoReloadTime = 2200; // 탄약 1발당 충전 시간 (ms)
    this.ammoTimer = 0;

    this.currentWave = 1;
    this.totalWaves = 3;
    this.isWaveInProgress = false;
    this.isGameOver = false;
    this.isVictory = false;

    // 공격 파라미터
    this.autoAttackInterval = 850; // 영웅 자동 공격 주기 (ms)
    this.lastAutoAttackTime = 0;
    this.autoDamage = 12;
    this.manualDamage = 38;

    // 장비 드랍 목록
    this.equipmentList = [
      { name: '낡은 철검', rank: '일반' },
      { name: '수호자의 방패', rank: '고급' },
      { name: '마법사의 로브', rank: '희귀' },
      { name: '신속의 장화', rank: '고급' },
      { name: '사냥꾼의 장궁', rank: '희귀' },
      { name: '용사의 건틀릿', rank: '영웅' }
    ];
    this.inventory = [];

    // 그룹 생성
    this.monsters = this.add.group();
    this.projectiles = this.add.group();

    // 1. 배경 생성 (타일 스프라이트)
    this.createBackground();

    // 2. 성 및 영웅 생성
    this.createCastleAndHero();

    // 3. UI 생성
    this.createUI();

    // 4. 입력 이벤트 (수동 터치 공격)
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    // 5. 웨이브 시작
    this.startWave(1);
  }

  createBackground() {
    // 배경 그리드 타일
    this.add.tileSprite(225, 400, 450, 800, 'ground_tile');

    // 전장 레인 가이드 라인 (연한 실선)
    const guides = this.add.graphics();
    guides.lineStyle(1, 0x243044, 0.4);
    for (let y = 160; y <= 680; y += 80) {
      guides.lineBetween(90, y, 450, y);
    }
  }

  createCastleAndHero() {
    // 성벽 (왼쪽 배치)
    this.castle = this.add.sprite(45, 400, 'castle_wall');

    // 영웅 (성벽 앞 중앙에 주둔)
    this.hero = this.add.sprite(75, 400, 'hero');
    this.hero.setDepth(5);

    // 영웅 호흡 애니메이션 효과
    this.tweens.add({
      targets: this.hero,
      scaleY: 1.08,
      scaleX: 0.96,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createUI() {
    // 상단 UI 컨테이너 바 (어두운 반투명 패널)
    const topBar = this.add.graphics();
    topBar.fillStyle(0x0f172a, 0.88);
    topBar.fillRoundedRect(10, 10, 430, 85, 12);
    topBar.lineStyle(2, 0x334155, 1);
    topBar.strokeRoundedRect(10, 10, 430, 85, 12);
    topBar.setDepth(20);

    // 웨이브 표시 텍스트
    this.waveText = this.add.text(25, 20, 'WAVE 1 / 3', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setDepth(21);

    // 성 체력 텍스트 & 게이지 바
    this.hpText = this.add.text(25, 48, '성 HP: 100/100', {
      fontFamily: 'sans-serif',
      fontSize: '13px',
      color: '#e2e8f0'
    }).setDepth(21);

    this.hpBarBg = this.add.graphics().setDepth(21);
    this.hpBarFill = this.add.graphics().setDepth(21);
    this.updateHpBar();

    // 골드 표시 (오른쪽 상단)
    this.add.sprite(320, 32, 'icon_gold').setDepth(21).setScale(1.1);
    this.goldText = this.add.text(338, 22, '0', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#facc15'
    }).setDepth(21);

    // 웨이브 진행 상태 바 (남은 몬스터 비율)
    this.waveProgressBg = this.add.graphics().setDepth(21);
    this.waveProgressBg.fillStyle(0x334155, 1);
    this.waveProgressBg.fillRoundedRect(25, 75, 400, 8, 4);

    this.waveProgressFill = this.add.graphics().setDepth(21);
    this.updateWaveProgressBar(0);

    // 하단 수동 공격 / 탄약 컨트롤 패널
    const bottomBar = this.add.graphics();
    bottomBar.fillStyle(0x0f172a, 0.85);
    bottomBar.fillRoundedRect(10, 700, 430, 88, 12);
    bottomBar.lineStyle(2, 0x334155, 1);
    bottomBar.strokeRoundedRect(10, 700, 430, 88, 12);
    bottomBar.setDepth(20);

    // 탄약 라벨
    this.add.text(25, 712, '수동 사격 탄약 (터치 시 발사)', {
      fontFamily: 'sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#fbbf24'
    }).setDepth(21);

    // 탄약 아이콘 슬롯들
    this.ammoIcons = [];
    this.ammoSlotBgs = [];
    for (let i = 0; i < this.maxAmmo; i++) {
      const slotX = 50 + i * 44;
      const slotY = 754;

      const emptyIcon = this.add.sprite(slotX, slotY, 'icon_ammo_empty').setDepth(21);
      const fullIcon = this.add.sprite(slotX, slotY, 'icon_ammo').setDepth(22);
      this.ammoSlotBgs.push(emptyIcon);
      this.ammoIcons.push(fullIcon);
    }

    // 탄약 재충전 게이지 바
    this.reloadBarBg = this.add.graphics().setDepth(21);
    this.reloadBarBg.fillStyle(0x334155, 1);
    this.reloadBarBg.fillRoundedRect(190, 746, 230, 14, 7);

    this.reloadBarFill = this.add.graphics().setDepth(21);
    this.reloadText = this.add.text(195, 726, '충전 중...', {
      fontFamily: 'sans-serif',
      fontSize: '12px',
      color: '#94a3b8'
    }).setDepth(21);

    this.updateAmmoUI();

    // 화면 중앙 상단 공지 텍스트 (웨이브 시작 / 보스 출현 알림)
    this.bannerText = this.add.text(225, 200, '', {
      fontFamily: 'sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#f8fafc',
      align: 'center',
      stroke: '#0f172a',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(40).setAlpha(0);
  }

  showBanner(msg, color = '#f8fafc', duration = 2000) {
    this.bannerText.setText(msg);
    this.bannerText.setColor(color);
    this.bannerText.setAlpha(1);
    this.bannerText.setScale(0.7);

    this.tweens.add({
      targets: this.bannerText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 350,
      yoyo: true,
      repeat: 0,
      onComplete: () => {
        this.time.delayedCall(duration - 600, () => {
          this.tweens.add({
            targets: this.bannerText,
            alpha: 0,
            duration: 400
          });
        });
      }
    });
  }

  updateHpBar() {
    this.hpBarBg.clear();
    this.hpBarBg.fillStyle(0x334155, 1);
    this.hpBarBg.fillRoundedRect(125, 50, 160, 12, 6);

    this.hpBarFill.clear();
    const ratio = Math.max(0, this.castleHp / this.castleMaxHp);
    const color = ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xf59e0b : 0xef4444;
    this.hpBarFill.fillStyle(color, 1);
    this.hpBarFill.fillRoundedRect(125, 50, 160 * ratio, 12, 6);

    this.hpText.setText(`성 HP: ${Math.max(0, Math.ceil(this.castleHp))}/${this.castleMaxHp}`);
  }

  updateWaveProgressBar(ratio) {
    this.waveProgressFill.clear();
    const clampedRatio = Phaser.Math.Clamp(ratio, 0, 1);
    this.waveProgressFill.fillStyle(0x38bdf8, 1);
    this.waveProgressFill.fillRoundedRect(25, 75, 400 * clampedRatio, 8, 4);
  }

  updateAmmoUI() {
    for (let i = 0; i < this.maxAmmo; i++) {
      this.ammoIcons[i].setVisible(i < this.ammo);
    }

    this.reloadBarFill.clear();
    if (this.ammo >= this.maxAmmo) {
      this.reloadBarFill.fillStyle(0x10b981, 1);
      this.reloadBarFill.fillRoundedRect(190, 746, 230, 14, 7);
      this.reloadText.setText('탄약 완전 장전됨 (터치 가능)');
      this.reloadText.setColor('#10b981');
    } else {
      const ratio = Phaser.Math.Clamp(this.ammoTimer / this.ammoReloadTime, 0, 1);
      this.reloadBarFill.fillStyle(0xf59e0b, 1);
      this.reloadBarFill.fillRoundedRect(190, 746, 230 * ratio, 14, 7);
      this.reloadText.setText(`재장전 중... (${Math.ceil((this.ammoReloadTime - this.ammoTimer) / 1000)}s)`);
      this.reloadText.setColor('#fbbf24');
    }
  }

  startWave(waveNum) {
    if (this.isGameOver || this.isVictory) return;

    this.currentWave = waveNum;
    this.waveText.setText(`WAVE ${this.currentWave} / ${this.totalWaves}`);
    this.isWaveInProgress = true;

    // 웨이브 스펙 정의
    let waveSpawns = [];
    if (waveNum === 1) {
      this.showBanner('웨이브 1 시작!\n고블린 무리가 몰려옵니다', '#38bdf8');
      // 일반 몬스터 8마리
      for (let i = 0; i < 8; i++) {
        waveSpawns.push({ type: 'normal', delay: 1000 + i * 1800 });
      }
    } else if (waveNum === 2) {
      this.showBanner('웨이브 2 시작!\n빠른 비행 몬스터가 출현합니다', '#c084fc');
      // 일반 7마리 + 빠른 몬스터 5마리 교차
      for (let i = 0; i < 12; i++) {
        const type = i % 2 === 0 ? 'normal' : 'fast';
        waveSpawns.push({ type, delay: 1000 + i * 1400 });
      }
    } else if (waveNum === 3) {
      this.showBanner('최종 웨이브 3!\n적 본대와 보스가 나타납니다!', '#ef4444');
      // 전위대 8마리 후 보스 등장
      for (let i = 0; i < 8; i++) {
        const type = i % 3 === 0 ? 'fast' : 'normal';
        waveSpawns.push({ type, delay: 1000 + i * 1300 });
      }
      // 보스 몬스터 등장
      waveSpawns.push({ type: 'boss', delay: 1000 + 8 * 1300 + 2000 });
    }

    this.totalWaveMonsters = waveSpawns.length;
    this.killedWaveMonsters = 0;
    this.updateWaveProgressBar(0);

    // 스폰 타이머 설정
    waveSpawns.forEach((spawn) => {
      this.time.delayedCall(spawn.delay, () => {
        if (!this.isGameOver && !this.isVictory) {
          this.spawnMonster(spawn.type);
        }
      });
    });
  }

  spawnMonster(type) {
    const yPos = Phaser.Math.Between(150, 660);
    const xPos = 475;

    let textureKey = 'monster_normal';
    let hp = 28;
    let speed = 48;
    let goldReward = 10;
    let castleDamage = 10;

    if (type === 'fast') {
      textureKey = 'monster_fast';
      hp = 18;
      speed = 85;
      goldReward = 15;
      castleDamage = 8;
    } else if (type === 'boss') {
      textureKey = 'monster_boss';
      hp = 260;
      speed = 22;
      goldReward = 100;
      castleDamage = 45;

      // 보스 등장 경고 연출
      this.showBanner('경고! 보스 출현!!', '#ef4444', 2500);
      this.cameras.main.shake(400, 0.008);
    }

    const monster = this.add.sprite(xPos, yPos, textureKey);
    monster.type = type;
    monster.maxHp = hp;
    monster.hp = hp;
    monster.speed = speed;
    monster.goldReward = goldReward;
    monster.castleDamage = castleDamage;
    monster.setDepth(10);

    // 몬스터 상단 체력바 그래픽 객체
    monster.hpBar = this.add.graphics().setDepth(11);
    this.updateMonsterHpBar(monster);

    this.monsters.add(monster);
  }

  updateMonsterHpBar(monster) {
    if (!monster.active || !monster.hpBar) return;
    monster.hpBar.clear();

    const barWidth = monster.type === 'boss' ? 50 : 28;
    const barHeight = monster.type === 'boss' ? 6 : 4;
    const barX = monster.x - barWidth / 2;
    const barY = monster.y - (monster.type === 'boss' ? 44 : 26);

    // 배경
    monster.hpBar.fillStyle(0x1e293b, 0.8);
    monster.hpBar.fillRect(barX, barY, barWidth, barHeight);

    // 채우기
    const ratio = Phaser.Math.Clamp(monster.hp / monster.maxHp, 0, 1);
    const color = monster.type === 'boss' ? 0xef4444 : 0x22c55e;
    monster.hpBar.fillStyle(color, 1);
    monster.hpBar.fillRect(barX, barY, barWidth * ratio, barHeight);
  }

  handlePointerDown(pointer) {
    if (this.isGameOver || this.isVictory) return;

    // 상단 UI 및 하단 UI 클릭 방지
    if (pointer.y < 100 || pointer.y > 690) return;

    if (this.ammo <= 0) {
      this.showFloatingText(pointer.x, pointer.y, '탄약 부족!', '#f87171');
      this.cameras.main.shake(100, 0.003);
      return;
    }

    // 가장 가까운 몬스터 탐색 (터치한 위치 기준)
    let target = null;
    let minDist = 180; // 터치 반경 내 탐색
    this.monsters.children.iterate((m) => {
      if (m && m.active) {
        const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, m.x, m.y);
        if (dist < minDist) {
          minDist = dist;
          target = m;
        }
      }
    });

    // 탄약 1 소모
    this.ammo--;
    this.updateAmmoUI();

    // 터치 이펙트 (조준선 연출)
    const crosshair = this.add.sprite(pointer.x, pointer.y, 'crosshair').setDepth(15).setScale(0.5);
    this.tweens.add({
      targets: crosshair,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 350,
      onComplete: () => crosshair.destroy()
    });

    // 수동 발사체 생성
    const targetX = target ? target.x : pointer.x;
    const targetY = target ? target.y : pointer.y;

    this.fireManualProjectile(targetX, targetY, target);
  }

  fireManualProjectile(targetX, targetY, lockedTarget) {
    const proj = this.add.sprite(this.hero.x + 20, this.hero.y, 'proj_manual').setDepth(12);
    const angle = Phaser.Math.Angle.Between(proj.x, proj.y, targetX, targetY);
    proj.setRotation(angle);

    const distance = Phaser.Math.Distance.Between(proj.x, proj.y, targetX, targetY);
    const duration = Math.max(180, (distance / 600) * 1000);

    this.tweens.add({
      targets: proj,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        proj.destroy();
        this.explodeManualAttack(targetX, targetY, lockedTarget);
      }
    });
  }

  explodeManualAttack(x, y, lockedTarget) {
    // 폭발 이펙트 (파티클 파편 및 링)
    const ring = this.add.graphics().setDepth(14);
    ring.lineStyle(3, 0xf97316, 1);
    ring.strokeCircle(x, y, 10);
    this.tweens.add({
      targets: ring,
      scaleX: 3.5,
      scaleY: 3.5,
      alpha: 0,
      duration: 300,
      onComplete: () => ring.destroy()
    });

    for (let i = 0; i < 8; i++) {
      const p = this.add.sprite(x, y, 'particle_hit').setDepth(14).setScale(Phaser.Math.FloatBetween(0.8, 1.3));
      const rad = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(20, 50);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(rad) * dist,
        y: y + Math.sin(rad) * dist,
        alpha: 0,
        duration: 350,
        onComplete: () => p.destroy()
      });
    }

    this.cameras.main.shake(150, 0.005);

    // 범위 스플래시 피해: 중심 70px 이내 모든 몬스터에게 강력한 대미지 적용
    this.monsters.children.iterate((m) => {
      if (m && m.active) {
        const d = Phaser.Math.Distance.Between(x, y, m.x, m.y);
        if (d <= 75) {
          const dmgRatio = 1 - (d / 150);
          const finalDmg = Math.round(this.manualDamage * dmgRatio);
          this.damageMonster(m, finalDmg, true);
        }
      }
    });
  }

  tryAutoAttack(time) {
    if (time - this.lastAutoAttackTime < this.autoAttackInterval) return;

    // 성벽에 가장 가까운(x 좌표가 가장 작은) 몬스터 우선 타겟팅
    let closestMonster = null;
    let minX = 9999;

    this.monsters.children.iterate((m) => {
      if (m && m.active && m.x < minX) {
        minX = m.x;
        closestMonster = m;
      }
    });

    if (closestMonster) {
      this.lastAutoAttackTime = time;
      this.fireAutoProjectile(closestMonster);
    }
  }

  fireAutoProjectile(target) {
    const proj = this.add.sprite(this.hero.x + 20, this.hero.y, 'proj_auto').setDepth(12);
    const targetX = target.x;
    const targetY = target.y;

    const angle = Phaser.Math.Angle.Between(proj.x, proj.y, targetX, targetY);
    proj.setRotation(angle);

    const distance = Phaser.Math.Distance.Between(proj.x, proj.y, targetX, targetY);
    const duration = Math.max(150, (distance / 500) * 1000);

    this.tweens.add({
      targets: proj,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        proj.destroy();
        if (target && target.active) {
          this.damageMonster(target, this.autoDamage, false);
        }
      }
    });
  }

  damageMonster(monster, damage, isManual) {
    if (!monster.active) return;

    monster.hp -= damage;
    this.updateMonsterHpBar(monster);

    // 피격 플래시 효과
    monster.setTint(0xffffff);
    this.time.delayedCall(80, () => {
      if (monster.active) monster.clearTint();
    });

    // 데미지 플로팅 텍스트
    const color = isManual ? '#ef4444' : '#e2e8f0';
    const prefix = isManual ? 'CRIT! -' : '-';
    this.showFloatingText(monster.x + Phaser.Math.Between(-10, 10), monster.y - 15, `${prefix}${damage}`, color, isManual ? 18 : 13);

    // 사망 처리
    if (monster.hp <= 0) {
      this.killMonster(monster);
    }
  }

  killMonster(monster) {
    if (!monster.active) return;

    // 골드 획득
    this.gold += monster.goldReward;
    this.goldText.setText(`${this.gold}`);
    this.showFloatingText(monster.x, monster.y - 25, `+${monster.goldReward}G`, '#facc15', 14);

    // 낮은 확률로 랜덤 장비 드랍 (일반 몬스터 8%, 보스는 100%)
    const dropRate = monster.type === 'boss' ? 1.0 : 0.08;
    if (Math.random() < dropRate) {
      const droppedItem = Phaser.Utils.Array.GetRandom(this.equipmentList);
      this.inventory.push(droppedItem);
      this.showToast(`장비 획득: [${droppedItem.rank}] ${droppedItem.name}!`);
    }

    // 사망 파티클
    for (let i = 0; i < 6; i++) {
      const p = this.add.sprite(monster.x, monster.y, 'particle_hit').setDepth(14).setScale(0.8);
      const rad = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const dist = Phaser.Math.Between(15, 35);
      this.tweens.add({
        targets: p,
        x: monster.x + Math.cos(rad) * dist,
        y: monster.y + Math.sin(rad) * dist,
        alpha: 0,
        duration: 300,
        onComplete: () => p.destroy()
      });
    }

    if (monster.hpBar) monster.hpBar.destroy();
    monster.destroy();

    // 웨이브 진행률 갱신
    this.killedWaveMonsters++;
    this.updateWaveProgressBar(this.killedWaveMonsters / this.totalWaveMonsters);

    // 웨이브 클리어 체크
    if (this.killedWaveMonsters >= this.totalWaveMonsters) {
      this.handleWaveClear();
    }
  }

  handleWaveClear() {
    this.isWaveInProgress = false;

    if (this.currentWave < this.totalWaves) {
      this.showBanner(`웨이브 ${this.currentWave} 클리어!`, '#22c55e', 2000);
      this.time.delayedCall(2500, () => {
        this.startWave(this.currentWave + 1);
      });
    } else {
      // 3웨이브 모두 클리어 -> 보스전 승리!
      this.handleVictory();
    }
  }

  handleCastleHit(monster) {
    if (!monster.active || this.isGameOver) return;

    this.castleHp -= monster.castleDamage;
    this.updateHpBar();

    // 화면 흔들림 및 성 플래시
    this.cameras.main.shake(200, 0.012);
    this.castle.setTint(0xef4444);
    this.time.delayedCall(120, () => this.castle.clearTint());

    this.showFloatingText(80, monster.y, `-${monster.castleDamage}`, '#ef4444', 16);

    // 몬스터 소멸
    if (monster.hpBar) monster.hpBar.destroy();
    monster.destroy();

    this.killedWaveMonsters++;
    this.updateWaveProgressBar(this.killedWaveMonsters / this.totalWaveMonsters);

    // 성 파괴 체크
    if (this.castleHp <= 0) {
      this.castleHp = 0;
      this.updateHpBar();
      this.handleGameOver();
    } else if (this.killedWaveMonsters >= this.totalWaveMonsters) {
      this.handleWaveClear();
    }
  }

  showFloatingText(x, y, text, color = '#ffffff', fontSize = 14) {
    const float = this.add.text(x, y, text, {
      fontFamily: 'sans-serif',
      fontSize: `${fontSize}px`,
      fontStyle: 'bold',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(30);

    this.tweens.add({
      targets: float,
      y: y - 35,
      alpha: 0,
      duration: 650,
      ease: 'Power1',
      onComplete: () => float.destroy()
    });
  }

  showToast(message) {
    const toastBg = this.add.graphics().setDepth(50);
    toastBg.fillStyle(0x1e1b4b, 0.95);
    toastBg.fillRoundedRect(35, 120, 380, 42, 8);
    toastBg.lineStyle(2, 0xa855f7, 1);
    toastBg.strokeRoundedRect(35, 120, 380, 42, 8);

    const toastText = this.add.text(225, 141, message, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#e9d5ff'
    }).setOrigin(0.5).setDepth(51);

    toastBg.setAlpha(0);
    toastText.setAlpha(0);

    this.tweens.add({
      targets: [toastBg, toastText],
      alpha: 1,
      duration: 250,
      yoyo: true,
      hold: 1800,
      onComplete: () => {
        toastBg.destroy();
        toastText.destroy();
      }
    });
  }

  handleGameOver() {
    this.isGameOver = true;

    // 모달 배경
    const overlay = this.add.graphics().setDepth(60);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 450, 800);

    const modal = this.add.graphics().setDepth(61);
    modal.fillStyle(0x1e293b, 1);
    modal.fillRoundedRect(45, 260, 360, 260, 16);
    modal.lineStyle(3, 0xef4444, 1);
    modal.strokeRoundedRect(45, 260, 360, 260, 16);

    this.add.text(225, 310, '게임 오버', {
      fontFamily: 'sans-serif',
      fontSize: '32px',
      fontStyle: 'bold',
      color: '#ef4444'
    }).setOrigin(0.5).setDepth(62);

    this.add.text(225, 365, `성이 파괴되었습니다!\n도달 웨이브: ${this.currentWave} / ${this.totalWaves}\n획득 골드: ${this.gold}G`, {
      fontFamily: 'sans-serif',
      fontSize: '16px',
      color: '#e2e8f0',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5).setDepth(62);

    // 다시 시작 버튼
    const restartBtn = this.add.graphics().setDepth(62);
    restartBtn.fillStyle(0xdc2626, 1);
    restartBtn.fillRoundedRect(125, 440, 200, 48, 10);
    restartBtn.setInteractive(new Phaser.Geom.Rectangle(125, 440, 200, 48), Phaser.Geom.Rectangle.Contains);

    const restartText = this.add.text(225, 464, '다시 도전하기', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(63);

    restartBtn.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  handleVictory() {
    this.isVictory = true;

    // 모달 배경
    const overlay = this.add.graphics().setDepth(60);
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, 450, 800);

    const modal = this.add.graphics().setDepth(61);
    modal.fillStyle(0x0f172a, 1);
    modal.fillRoundedRect(40, 230, 370, 320, 16);
    modal.lineStyle(3, 0x38bdf8, 1);
    modal.strokeRoundedRect(40, 230, 370, 320, 16);

    this.add.text(225, 275, 'VICTORY!', {
      fontFamily: 'sans-serif',
      fontSize: '34px',
      fontStyle: 'bold',
      color: '#38bdf8'
    }).setOrigin(0.5).setDepth(62);

    const eqCount = this.inventory.length;
    this.add.text(225, 350, `보스를 격퇴하고 성을 지켰습니다!\n\n총 획득 골드: ${this.gold}G\n획득한 장비: ${eqCount}개\n\n(다음 단계: 성 내부 씬에서 정비 진행)`, {
      fontFamily: 'sans-serif',
      fontSize: '15px',
      color: '#f8fafc',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5).setDepth(62);

    // 다시 플레이 버튼
    const nextBtn = this.add.graphics().setDepth(62);
    nextBtn.fillStyle(0x2563eb, 1);
    nextBtn.fillRoundedRect(110, 470, 230, 48, 10);
    nextBtn.setInteractive(new Phaser.Geom.Rectangle(110, 470, 230, 48), Phaser.Geom.Rectangle.Contains);

    this.add.text(225, 494, '전투 다시 시작', {
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(63);

    nextBtn.on('pointerdown', () => {
      this.scene.restart();
    });
  }

  update(time, delta) {
    if (this.isGameOver || this.isVictory) return;

    // 1. 탄약 재충전 로직
    if (this.ammo < this.maxAmmo) {
      this.ammoTimer += delta;
      if (this.ammoTimer >= this.ammoReloadTime) {
        this.ammo++;
        this.ammoTimer = 0;
        this.updateAmmoUI();
      } else {
        this.updateAmmoUI();
      }
    }

    // 2. 영웅 자동 공격
    this.tryAutoAttack(time);

    // 3. 몬스터 이동 및 성 충돌 체크
    this.monsters.children.iterate((m) => {
      if (m && m.active) {
        // 왼쪽으로 이동
        m.x -= (m.speed * delta) / 1000;

        // 체력바 위치 갱신
        this.updateMonsterHpBar(m);

        // 성(x <= 85)에 도달 시 충돌 데미지
        if (m.x <= 85) {
          this.handleCastleHit(m);
        }
      }
    });
  }
}

