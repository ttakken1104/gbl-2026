/**
 * TextureGenerator.js
 * 별도의 이미지 파일 없이 Phaser Graphics를 이용해 게임에 필요한 모든 텍스처를 프로그래밍 방식으로 생성합니다.
 */
export function createGameTextures(scene) {
  // 1. 성벽 (Castle Wall) 텍스처 (너비 90, 높이 800)
  if (!scene.textures.exists('castle_wall')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 성벽 베이스
    g.fillStyle(0x3a404a, 1);
    g.fillRect(0, 0, 90, 800);
    // 벽돌 패턴
    g.fillStyle(0x4a5260, 1);
    for (let y = 0; y < 800; y += 40) {
      const offsetX = (y / 40) % 2 === 0 ? 0 : 20;
      for (let x = offsetX; x < 90; x += 45) {
        g.fillRect(x + 2, y + 2, 40, 36);
      }
    }
    // 성문/배틀탑 라인
    g.fillStyle(0x23272e, 1);
    g.fillRect(84, 0, 6, 800);
    g.fillRect(0, 0, 6, 800);

    // 흉벽 (상/하/중간 돌출부 장식)
    g.fillStyle(0x5b6577, 1);
    for (let y = 0; y < 800; y += 80) {
      g.fillRoundedRect(72, y + 10, 16, 20, 3);
    }
    g.generateTexture('castle_wall', 90, 800);
    g.destroy();
  }

  // 2. 영웅 (Hero) 텍스처 (크기 44x44)
  if (!scene.textures.exists('hero')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 망토 / 후광
    g.fillStyle(0x1e3a8a, 1);
    g.fillCircle(22, 22, 18);
    // 몸체 (갑옷)
    g.fillStyle(0x3b82f6, 1);
    g.fillCircle(22, 22, 14);
    // 모자/투구 장식
    g.fillStyle(0xf59e0b, 1);
    g.fillTriangle(22, 6, 14, 18, 30, 18);
    // 얼굴
    g.fillStyle(0xfde68a, 1);
    g.fillCircle(22, 22, 7);
    // 눈빛
    g.fillStyle(0x1e293b, 1);
    g.fillCircle(25, 21, 2);
    // 활/지팡이 형태 (오른쪽으로 겨냥)
    g.lineStyle(3, 0xd97706, 1);
    g.beginPath();
    g.arc(28, 22, 12, -Math.PI / 3, Math.PI / 3, false);
    g.strokePath();
    g.generateTexture('hero', 44, 44);
    g.destroy();
  }

  // 3. 일반 몬스터 (Normal Goblin/Slime) (크기 36x36)
  if (!scene.textures.exists('monster_normal')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 몸체 (초록색)
    g.fillStyle(0x16a34a, 1);
    g.fillCircle(18, 18, 15);
    // 귀
    g.fillStyle(0x15803d, 1);
    g.fillTriangle(6, 6, 14, 8, 10, 16);
    g.fillTriangle(30, 6, 22, 8, 26, 16);
    // 눈 (붉은 빛)
    g.fillStyle(0xef4444, 1);
    g.fillCircle(12, 16, 3);
    g.fillCircle(20, 16, 3);
    // 이빨
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(14, 25, 16, 21, 18, 25);
    g.generateTexture('monster_normal', 36, 36);
    g.destroy();
  }

  // 4. 빠른 몬스터 (Fast Monster) (크기 32x32)
  if (!scene.textures.exists('monster_fast')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 날렵한 형태 (보라색)
    g.fillStyle(0x9333ea, 1);
    g.fillTriangle(6, 16, 28, 6, 28, 26);
    // 코어/날개
    g.fillStyle(0xc084fc, 1);
    g.fillCircle(18, 16, 8);
    // 안광
    g.fillStyle(0xfde047, 1);
    g.fillCircle(12, 16, 2.5);
    g.generateTexture('monster_fast', 32, 32);
    g.destroy();
  }

  // 5. 보스 몬스터 (Boss Monster) (크기 70x70)
  if (!scene.textures.exists('monster_boss')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 외곽 아우라
    g.fillStyle(0x7f1d1d, 0.4);
    g.fillCircle(35, 35, 34);
    // 거대한 몸체
    g.fillStyle(0xb91c1c, 1);
    g.fillCircle(35, 35, 27);
    // 뿔
    g.fillStyle(0x450a0a, 1);
    g.fillTriangle(14, 18, 8, 2, 22, 12);
    g.fillTriangle(56, 18, 62, 2, 48, 12);
    // 황금 왕관 장식
    g.fillStyle(0xf59e0b, 1);
    g.fillRect(25, 12, 20, 6);
    g.fillTriangle(25, 12, 28, 6, 31, 12);
    g.fillTriangle(32, 12, 35, 4, 38, 12);
    g.fillTriangle(39, 12, 42, 6, 45, 12);
    // 타오르는 눈
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(27, 32, 5);
    g.fillCircle(43, 32, 5);
    g.fillStyle(0xd97706, 1);
    g.fillCircle(27, 32, 2);
    g.fillCircle(43, 32, 2);
    // 어금니
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(28, 48, 31, 42, 34, 48);
    g.fillTriangle(36, 48, 39, 42, 42, 48);
    g.generateTexture('monster_boss', 70, 70);
    g.destroy();
  }

  // 6. 자동 공격 투사체 (화살/에너지 볼트) (크기 20x10)
  if (!scene.textures.exists('proj_auto')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x60a5fa, 0.7);
    g.fillRoundedRect(0, 2, 16, 6, 3);
    g.fillStyle(0x93c5fd, 1);
    g.fillTriangle(12, 0, 20, 5, 12, 10);
    g.generateTexture('proj_auto', 20, 10);
    g.destroy();
  }

  // 7. 수동 공격 투사체 (강력한 파이어볼/폭렬탄) (크기 28x28)
  if (!scene.textures.exists('proj_manual')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 외부 화염
    g.fillStyle(0xf97316, 0.5);
    g.fillCircle(14, 14, 13);
    // 중심 코어
    g.fillStyle(0xef4444, 1);
    g.fillCircle(14, 14, 9);
    // 고에너지 중심
    g.fillStyle(0xfef08a, 1);
    g.fillCircle(14, 14, 5);
    g.generateTexture('proj_manual', 28, 28);
    g.destroy();
  }

  // 8. 피격/폭발 파티클 (크기 12x12)
  if (!scene.textures.exists('particle_hit')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xfbbf24, 1);
    g.fillCircle(6, 6, 6);
    g.generateTexture('particle_hit', 12, 12);
    g.destroy();
  }

  // 9. 탄약 아이콘 (Ammo Icon) (크기 24x36)
  if (!scene.textures.exists('icon_ammo')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    // 탄두
    g.fillStyle(0xf59e0b, 1);
    g.fillRoundedRect(4, 8, 16, 24, 4);
    g.fillTriangle(4, 10, 12, 1, 20, 10);
    // 탄피 밑부분
    g.fillStyle(0xd97706, 1);
    g.fillRect(3, 28, 18, 5);
    // 하이라이트
    g.fillStyle(0xfef3c7, 0.8);
    g.fillRect(7, 10, 3, 16);
    g.generateTexture('icon_ammo', 24, 36);
    g.destroy();
  }

  // 10. 탄약 빈 슬롯 아이콘 (Empty Ammo) (크기 24x36)
  if (!scene.textures.exists('icon_ammo_empty')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(2, 0x475569, 1);
    g.strokeRoundedRect(4, 8, 16, 24, 4);
    g.strokeTriangle(4, 10, 12, 1, 20, 10);
    g.generateTexture('icon_ammo_empty', 24, 36);
    g.destroy();
  }

  // 11. 골드 코인 아이콘 (크기 20x20)
  if (!scene.textures.exists('icon_gold')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xeab308, 1);
    g.fillCircle(10, 10, 9);
    g.fillStyle(0xfacc15, 1);
    g.fillCircle(10, 10, 7);
    g.fillStyle(0xca8a04, 1);
    g.fillRect(8, 5, 4, 10);
    g.generateTexture('icon_gold', 20, 20);
    g.destroy();
  }

  // 12. 조준선/타겟 마커 (크기 32x32)
  if (!scene.textures.exists('crosshair')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.lineStyle(2, 0xef4444, 0.9);
    g.strokeCircle(16, 16, 12);
    g.lineBetween(16, 0, 16, 8);
    g.lineBetween(16, 24, 16, 32);
    g.lineBetween(0, 16, 8, 16);
    g.lineBetween(24, 16, 32, 16);
    g.generateTexture('crosshair', 32, 32);
    g.destroy();
  }

  // 13. 전장 배경 바닥 타일 (Grid/Ground texture 60x60)
  if (!scene.textures.exists('ground_tile')) {
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x181e28, 1);
    g.fillRect(0, 0, 60, 60);
    g.lineStyle(1, 0x222a38, 0.6);
    g.strokeRect(0, 0, 60, 60);
    // 잔디/먼지 점
    g.fillStyle(0x273142, 0.8);
    g.fillCircle(15, 20, 2);
    g.fillCircle(45, 40, 2);
    g.generateTexture('ground_tile', 60, 60);
    g.destroy();
  }
}

