const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
    path.join(__dirname, '..', 'models', 'world.class.js'),
    'utf8'
) + '\nglobalThis.World = World;';

function expect(condition, message) {
    if (!condition) throw new Error(message);
    console.log(`PASS ${message}`);
}

function createDeathVoice() {
    const listeners = {};
    return {
        addEventListener(type, callback) {
            listeners[type] = callback;
        },
        emit(type) {
            listeners[type]?.();
        }
    };
}

async function runDeathSequence(playback) {
    const context = {
        console,
        Character: class Character {},
        StatusBar: class StatusBar {},
        StatusBarBottle: class StatusBarBottle {},
        StatusBarCoin: class StatusBarCoin {},
        StatusBarEndboss: class StatusBarEndboss {},
        window: {
            setTimeout(callback) {
                context.scheduledFinish = callback;
            }
        },
        currentBgm: { pause() {} },
        AUDIO_HUB: { bgmLost: {} },
        playBgm() {
            context.bgmStarts++;
        },
        bgmStarts: 0
    };
    vm.runInNewContext(source, context);

    const voice = createDeathVoice();
    context.playRandomPepeDeadVoice = () => ({ voice, playback });
    const world = Object.create(context.World.prototype);
    world.gameEnded = false;
    world.character = { resetIdleTimer() {} };
    world.showEndScreen = () => {
        context.endScreenCalls++;
    };
    context.endScreenCalls = 0;
    context.world = world;

    world.startPepeDeathSequence();
    await Promise.resolve();
    return { context, voice };
}

(async () => {
    const muted = await runDeathSequence(Promise.resolve(false));
    muted.context.scheduledFinish();
    muted.context.scheduledFinish();
    expect(muted.context.endScreenCalls === 1,
        'muted death reaches Game Over exactly once after the animation delay');

    const failed = await runDeathSequence(Promise.resolve(false));
    failed.voice.emit('error');
    failed.context.scheduledFinish();
    expect(failed.context.endScreenCalls === 1,
        'audio playback failure reaches Game Over exactly once');

    const audible = await runDeathSequence(Promise.resolve(true));
    audible.voice.emit('ended');
    expect(audible.context.endScreenCalls === 1,
        'audible death still completes when the voice ends');
})();
