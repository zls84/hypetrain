//let tmi = require('tmijs/tmi.js');

let corrections = [0, 0, 0, 0];
let actualState = [0, 0, 0, 0];

const bitsPerSubs = [1, 500, 1000, 1500];

const bitsPerLevels = [
    [ 1600,  1800,  2100,  2300,  3000],
    [ 2000,  2500,  3100,  3900,  5500],
    [ 3000,  4000,  5300,  6800,  9900],
    [ 5000,  7500, 10600, 14600, 22300],
    [10000, 15000, 20000, 25000, 35000]
]
let HypeTrainDifficulty = -1;

function updateLevelTable()
{
    HypeTrainDifficulty = $("#difficulty").val();
    for (let i = 1; i <= 5; ++i)
    {
        let bits = bitsPerLevels[HypeTrainDifficulty][i-1];
        let subs = Math.ceil(bits / bitsPerSubs[1]);
        $(`#level${i}bits`).text(bits);
        $(`#level${i}subs`).text(subs);
    }
}

function GetMinInLevel(levelValue)
{
    let minBits = 0;
    for (let i = 0; i < levelValue; ++i)
        minBits += bitsPerLevels[HypeTrainDifficulty][i];
    return minBits;
}

function GetDiffInLevel(levelValue)
{
    return bitsPerLevels[HypeTrainDifficulty][levelValue];
}

function GetMaxInLevel(levelValue)
{
    return GetMinInLevel(levelValue) + GetDiffInLevel(levelValue);
}

function calculateBits(levelValue, percentValue)
{
    let bitsUsed = GetMinInLevel(levelValue);
    bitsUsed += percentValue * GetDiffInLevel(levelValue) / 100.0;
    return bitsUsed;
}

function calculateMinMaxBits(levelId, percentId)
{ //TODO: Kipofozni, mert jelenleg 1 bit távolság van a szintek közt.
    let ActualLevel = parseInt($(levelId).val());
    let ActualPercent = parseInt($(percentId).val());

    let bitsMinValue = Math.round(calculateBits(ActualLevel, ActualPercent-0.5));
    bitsMinValue = Math.max(bitsMinValue, GetMinInLevel(ActualLevel));

    let bitsMaxValue = Math.round(calculateBits(ActualLevel, ActualPercent+0.5));

    if (ActualLevel < 4)
        bitsMaxValue = Math.min(bitsMaxValue, GetMaxInLevel(ActualLevel)) - 1;
    else
        bitsMaxValue = bitsMaxValue - 1;

    return [bitsMinValue, bitsMaxValue];
}

function updateDonateTexts(bitsValue, bitsValueId, subsValueId)
{
    let subsUsed = Math.floor(bitsValue / bitsPerSubs[1]);
    let bitsRemain = bitsValue - subsUsed * bitsPerSubs[1];
    if (subsValueId)
    {
        $(bitsValueId).text(bitsValue);
        $(subsValueId).text(`${subsUsed}+(${bitsRemain})`);
    }
    else
    {
        $(bitsValueId).text(`${bitsValue} = ${subsUsed}+(${bitsRemain})`);
    }
}

function updateSomeDonates(levelId, percentId, bitsValueId, subsValueId, bitsMaxValueId, subsMaxValueId)
{
    let bits = calculateMinMaxBits(levelId, percentId);    

    updateDonateTexts(bits[0], bitsValueId, subsValueId);
    updateDonateTexts(bits[1], bitsMaxValueId, subsMaxValueId);
    return bits;
}

function updateActualDonates()
{
    let bitsValue = 0;
    bitsValue += parseInt($("#t0Sum").text()) * bitsPerSubs[0];
    bitsValue += parseInt($("#t1Sum").text()) * bitsPerSubs[1];
    bitsValue += parseInt($("#t2Sum").text()) * bitsPerSubs[2];
    bitsValue += parseInt($("#t3Sum").text()) * bitsPerSubs[3];

    let bitsValueMin = bitsValue + parseInt($("#correctionRequiredMin").text());
    let bitsValueMax = bitsValue + parseInt($("#correctionRequiredMax").text());

    updateAddsField(bitsValueMin, "#actualLevelMin", "#actualPercentMin");
    updateAddsField(bitsValue, "#actualLevel", "#actualPercent");
    updateAddsField(bitsValueMax, "#actualLevelMax", "#actualPercentMax");
    updateDonateTexts(bitsValueMin, "#actualBitValueMin", "#actualSubValueMin");
    updateDonateTexts(bitsValue, "#actualBitValue", "#actualSubValue");
    updateDonateTexts(bitsValueMax, "#actualBitValueMax", "#actualSubValueMax");
    
    return [
        bitsValueMin, 
        bitsValue, 
        bitsValueMax 
    ];
}

function updateTargetDonates()
{
    return updateSomeDonates("#targetLevel", "#targetPercent", "#targetBitValue", "#targetSubValue", "#targetBitValueMax", "#targetSubValueMax");
}

function updateDonates()
{
    let bitsTarget = updateTargetDonates();
    let bitsActual = updateActualDonates();

    const names = [
        ["#reqMinToMin", "#reqMinToMax"],
        ["#reqPrcToMin", "#reqPrcToMax"],
        ["#reqMaxToMin", "#reqMaxToMax"]
    ];

    for (let ac = 0; ac < bitsActual.length; ++ac)
    {
        for (let tg = 0; tg < bitsTarget.length; ++tg)
        {
            let bitsRequired = bitsTarget[tg]-bitsActual[ac];
            if (bitsRequired > 0)
            {
                updateDonateTexts(bitsRequired, names[ac][tg]);
            }
            else
            {
                $(names[ac][tg]).text("!!!DONE!!!");
            }
        }
    }

    updateAdds();
}

function updateAddsField(actualBitsValue, levelField, percentField)
{
    let targetBitsValue = actualBitsValue;

    let targetLevel = 0;
    let targetPercent = 0;

    for (let i = 0; i < 4; ++i)
    {
        let actualLevelBits = bitsPerLevels[HypeTrainDifficulty][i];
        if (targetBitsValue < actualLevelBits)
            break;
        ++targetLevel;
        targetBitsValue -= actualLevelBits;
    }

    targetPercent = Math.round(targetBitsValue * 100 / bitsPerLevels[HypeTrainDifficulty][targetLevel]);

    $(levelField).text(`Level ${targetLevel + 1}`);
    $(percentField).text(`${targetPercent} %`);
}

function updateAdds()
{
    let actualBits = parseInt($("#actualBitValue").text());
    let addBits = parseInt($("#addBitValue").val()) + parseInt($("#addSubValue").val()) * bitsPerSubs[1];
    let correctionMin = parseInt($("#correctionRequiredMin").text());
    let correctionMax = parseInt($("#correctionRequiredMax").text());

    updateAddsField(actualBits + addBits + correctionMin, "#addLevelToMin", "#addPercentToMin");
    updateAddsField(actualBits + addBits, "#addLevel", "#addPercent");
    updateAddsField(actualBits + addBits + correctionMax, "#addLevelToMax", "#addPercentToMax");
}

function actualizeLevel()
{
    updateLevelTable();
    updateStart();
    updateDonates();
}

function updateActualLevel()
{
    updateActualDonates();
    updateDonates();

    $("#subcount").text(
        actualState[1]+actualState[2]+actualState[3]+
        corrections[1]+corrections[2]+corrections[3]
    );
    $("#bitcount").text(
        actualState[0]+corrections[0]
    );
}

function updateStart()
{
    let startBits = calculateMinMaxBits("#startLevel", "#startPercent");

    let minValue = startBits[0];
    let addValue = startBits[1] - minValue;

    for (let i = 0; i <= 3; ++i)
        minValue -= corrections[i] * bitsPerSubs[i];

    let maxValue = minValue + addValue;

    $("#correctionRequiredMin").text(minValue);
    $("#correctionRequiredAdd").text(addValue);
    $("#correctionRequiredMax").text(maxValue);

    updateDonates();
}

function resetEverything()
{
    actualState = [0, 0, 0, 0];
    updateActualLevel();

    $("#t0Detected").text(actualState[0]);
    $(`#t0Sum`).text(actualState[0]+corrections[0]);
    $(`#t1Detected`).text(actualState[1]);
    $(`#t1Sum`).text(actualState[1]+corrections[1]);
    $(`#t2Detected`).text(actualState[2]);
    $(`#t2Sum`).text(actualState[2]+corrections[2]);
    $(`#t3Detected`).text(actualState[3]);
    $(`#t3Sum`).text(actualState[3]+corrections[3]);

    $("#subcount").text(
        actualState[1]+actualState[2]+actualState[3]+
        corrections[1]+corrections[2]+corrections[3]
    );
    $("bitcount").text(
        actualState[0]+corrections[0]
    );
}

$(document).ready(function() {
    $("#test").click(() => 
        addEventText("Test Event")
    );

    $("#difficulty").change(updateLevel);

    $("#startLevel").change(updateStart);
    $("#startPercent").change(updateStart);

    $("#targetLevel").change(updateDonates);
    $("#targetPercent").change(updateDonates);

    $("#addBitValue").change(updateAdds);
    $("#addSubValue").change(updateAdds);

    $("#t0Correction").change(() => {
        corrections[0] = parseInt($("#t0Correction").val());
        $(`#t0Sum`).text(actualState[0]+corrections[0]);
        updateActualLevel();
        updateStart();
    });

    $("#t1Correction").change(() => {
        corrections[1] = parseInt($("#t1Correction").val());
        $(`#t1Sum`).text(actualState[1]+corrections[1]);
        updateActualLevel();
        updateStart();
    });

    $("#t2Correction").change(() => {
        corrections[2] = parseInt($("#t2Correction").val());
        $(`#t2Sum`).text(actualState[2]+corrections[2]);
        updateActualLevel();
        updateStart();
    });

    $("#t3Correction").change(() => {
        corrections[3] = parseInt($("#t3Correction").val());
        $(`#t3Sum`).text(actualState[3]+corrections[3]);
        updateActualLevel();
        updateStart();
    });

    $("#precise").change(() => {
        let enabled = $("#precise").prop('checked');
        if (enabled)
        {
            $(".notprecise").hide();
            $(".precise3").prop('colspan', 1);
        }
        else
        {
            $(".notprecise").show();
            $(".precise3").prop('colspan', 3);
        }
    });

    actualizeLevel();
});


/// Beállítja az aktuális hype train szintet a csatornánál tároltra
function UpdateHypeTrainDifficulty()
{
    let level = localStorage.getItem(activeChannel+'level');
    if (level)
    {
        $("#difficulty").val(level);
        actualizeLevel();
    }
}

/// Frissíti a csatornához tartozó hype train szintet
function updateLevel()
{
    actualizeLevel();
    if (activeChannel)
        localStorage.setItem(activeChannel+"level", HypeTrainDifficulty);
}

/*
Channel form.
 */
$('#channelForm').submit(() => {
    if (activeChannel)
        client.part(activeChannel);
    activeChannel = `#${$("#channel").val()}`;

    resetEverything();

    $("#connected").prop('checked', false);
    client.join(activeChannel)
        .then(() => {
            UpdateHypeTrainDifficulty();
            $("#connected").prop('checked', true);
        });

    event.preventDefault();
});

let activeChannel = null;
let client = new tmi.Client({});

client.connect();

function apply_subscription(methods, subCount = 1)
{
    let tier = methods.prime ? 1 : methods.plan / 1000;
    actualState[tier]+=subCount;
    $(`#t${tier}Detected`).text(actualState[tier]);
    $(`#t${tier}Sum`).text(actualState[tier]+corrections[tier]);
    updateActualLevel();
}

function apply_bits(bits)
{
    actualState[0]+=parseInt(bits);
    $("#t0Detected").text(actualState[0]);
    $(`#t0Sum`).text(actualState[0]+corrections[0]);
    updateActualLevel();
}

function subscription(methods, subCount = 1)
{
    apply_subscription(methods, subCount);
}

function cheer(bits)
{
    apply_bits(bits);
}

function soundalert(bits, user, sound)
{
    apply_bits(bits);
    addEventText(`${user} played ${sound} for ${bits} bits\n`);
}

function addEventText(txt)
{
    $("#eventlist").append(txt);
}

client.on('subscription', (channel, username, methods, message, userstate) => {
    subscription(methods);
    if (methods.prime)
        addEventText(`sub: ${username} prime\n`);
    else
        addEventText(`sub: ${username} ${methods.plan} - ${methods.planName}\n`);
});

client.on('resub', (channel, username, months, message, userstate, methods) => {
    subscription(methods);
    if (methods.prime)
        addEventText(`resub: ${username} prime Months: ${months}\n`);
    else
        addEventText(`resub: ${username} ${methods.plan} - ${methods.planName} Months: ${months}\n`);
});

client.on('anonsubgift', (channel, streakMonths, recipient, methods, userstate) => {
    subscription(methods);
    addEventText(`subgift: *** -${streakMonths}-> ${recipient} ${methods.plan} - ${methods.planName}\n`);
});

client.on('subgift', (channel, username, streakMonths, recipient, methods, userstate) => {
    subscription(methods);
    addEventText(`subgift: ${username} -${streakMonths}-> ${recipient} ${methods.plan} - ${methods.planName}\n`);
});

client.on('anonsubmysterygift', (channel, numbOfSubs, methods, userstate) => {
    addEventText(`mysterysubgift: *** ${numbOfSubs} ${methods.plan} - ${methods.planName}\n`);
});

client.on('submysterygift', (channel, username, numbOfSubs, methods, userstate) => {
    addEventText(`mysterysubgift: ${username} ${numbOfSubs} ${methods.plan} - ${methods.planName}\n`);
});

client.on('primepaidupgrade', (channel, username, methods, userstate) => {
    addEventText(`primepaidupgrade: ${username} prime -> ${methods.plan} - ${methods.planName}\n`);
});

client.on('giftpaidupgrade', (channel, username, sender, userstate) => {
    addEventText(`giftpaidupgrade: ${username} upgraded sub from ${sender}\n`);
});

client.on('anongiftpaidupgrade', (channel, username, userstate) => {
    addEventText(`giftpaidupgrade: ${username} upgraded sub from ***\n`);
});

client.on('cheer', (channel, userstate, message) => {
    cheer(userstate.bits);
    addEventText(`cheer: ${userstate['display-name']} ${userstate.bits}\n`);
});

function getSoundAlert(message)
{
    let user = null;
    let bits = null;
    let sound = null;

    let result = message.match(/^(\S+) used (\d+) Bits to play ([\S\s]*)$/);
    if (result != null)
    {
        //SoundAlerts: zls84 used 50 Bits to play knock
        user = result[1];
        bits = parseInt(result[2]);
        sound = result[3];
    }
    else
    {
        result = message.match(/(\S*) ezzel ijeszt halálra: ([\s\S^(]*) \( (\d*) Bits \)/);
        if (result != null)
        {
            //SoundAlerts: zls84 ezzel ijeszt halálra: realistic knocking ( 100 Bits )
            user = result[1];
            sound = result[2];
            bits = parseInt(result[3]);
        }
        else
        {
            bits = message.match(/(\d+) Bits/);
            user = message.match(/(\S*)/);
        }
    }

    return {
        user: user,
        bits: bits,
        sound: sound
    };
}

client.on('message', (channel, tags, message, self) => {
    if (self) return;

    if (tags['display-name'] === 'SoundAlerts')
    {
        let r = getSoundAlert(message);
        soundalert(r.bits, r.user, r.sound);
    }

    $("#chat").append(`${tags['display-name']}: ${message}\n`);
    //$("#chat").text(`Last Message:\n${tags['display-name']}: ${message}\n`);
    //console.log(`${tags['display-name']}: ${message}`);
});
