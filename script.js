let elements;
let atomicNumber = 1;
const rangeInput = $('#atomic-number-range'),
    incrementButton = $('#increase-atomic-number'),
    decrementButton = $('#decrease-atomic-number'),
    tooltip = $('#tooltip');
const elementColors = {
    "Other Non-metal": '#52ee61',
    "Noble Gas": '#759fff',
    "Alkali Metal": '#ecc262',
    "Alkaline Earth Metal": '#c9cd44',
    "Metalloid": '#3cefbe',
    "Halogen": '#b4b4b4',
    "Post-transition Metal": '#4cddf3',
    "Transition Metal": '#fd8572',
    "Lanthanoid": '#ac82df',
    "Actinoid": '#ec77a3'
};
let tippyTooltip = null;

$(document).ready(() => {
    fetch('elements.json')
        .then(response => response.json())
        .then(data => {
            elements = data;
            updateAtomDetails(atomicNumber);
            updateNucleusToolTip();
            highlightConfiguration();
        })
        .catch(error => {
            alert('Error fetching data');
            console.error('Error fetching data: ', error);
        });

    incrementButton.click(() => changeAtomicNumber(1));
    decrementButton.click(() => changeAtomicNumber(-1));
    let sliderTimeout;
    rangeInput.on('input', () => { updateSlider(); tooltip.fadeIn(200); })
        .on('change', updateAtomStructure)
        .blur(() => tooltip.fadeOut(200))
        .mousedown(() => clearTimeout(sliderTimeout))
        .mouseup(() => { sliderTimeout = setTimeout(() => { tooltip.fadeOut(200) }, 2000) });

    $('#toggle-settings').click(toggleSettingBar);
    $('#search').click(searchElement);
    $('#animate-atom').click(function() {
        $('.orbits').css('animation-play-state',
            $(this).prop('checked') ? 'running' : 'paused'
        );
    });
});

function changeAtomicNumber(change) {
    atomicNumber = Math.max(1, Math.min(atomicNumber + change, 118));
    rangeInput.val(atomicNumber);
    incrementButton.prop('disabled', atomicNumber >= 118);
    decrementButton.prop('disabled', atomicNumber <= 1);
    updateAtomStructure();
}

function updateAtomStructure() {
    updateAtomDetails(atomicNumber);
    updateNucleusToolTip();
    updateSlider();
    highlightConfiguration();
    document.documentElement.style.setProperty('--element-color',
        elementColors[elements[atomicNumber - 1].type]
    );
}

function updateAtomDetails(atomNum) {
    $('#atomic-number').text(atomNum);
    $('#atomic-mass').text(parseInt(elements[atomNum - 1]["atomic mass"].toString().replace(/[()]/g, '')));
    $('#element-name').text(elements[atomNum - 1].name.short);
    updateElectrons();
}

function updateSlider() {
    atomicNumber = Number(rangeInput.val());
    const percentage = atomicNumber / 118 * 100;
    rangeInput.css('background', `linear-gradient(to right, var(--bgcolor) ${percentage}%, var(--linecolor) 0)`);
    const thumbSize = 18;
    tooltip.text(atomicNumber).css('left', `${(atomicNumber / 118) * (rangeInput.outerWidth() - thumbSize) + (tooltip.outerWidth() / 2) - (thumbSize / 2)}px`);
    incrementButton.prop('disabled', atomicNumber >= 118);
    decrementButton.prop('disabled', atomicNumber <= 1);
}

function getElectronicConfiguration(atomNum) {
    const configuration = [];
    const subshells = [
        { name: '1s', maxElectrons: 2 },
        { name: '2s', maxElectrons: 2 },
        { name: '2p', maxElectrons: 6 },
        { name: '3s', maxElectrons: 2 },
        { name: '3p', maxElectrons: 6 },
        { name: '4s', maxElectrons: 2 },
        { name: '3d', maxElectrons: 10 },
        { name: '4p', maxElectrons: 6 },
        { name: '5s', maxElectrons: 2 },
        { name: '4d', maxElectrons: 10 },
        { name: '5p', maxElectrons: 6 },
        { name: '6s', maxElectrons: 2 },
        { name: '4f', maxElectrons: 14 },
        { name: '5d', maxElectrons: 10 },
        { name: '6p', maxElectrons: 6 },
        { name: '7s', maxElectrons: 2 },
        { name: '5f', maxElectrons: 14 },
        { name: '6d', maxElectrons: 10 },
        { name: '7p', maxElectrons: 6 }
    ];
    let remainingElectrons = atomNum;
    let index = 0;
    while (remainingElectrons != 0) {
        const { name, maxElectrons } = subshells[index];
        const electronInSubShell = Math.min(remainingElectrons, maxElectrons);
        configuration.push([name, electronInSubShell]);
        remainingElectrons -= electronInSubShell;
        index++;
    }
    if ([24, 41, 42, 47].includes(atomNum)) {
        let valenceElectron = [configuration.pop(), configuration.pop()];
        valenceElectron[0][1]++;
        valenceElectron[1][1]--;
        configuration.push(valenceElectron[1], valenceElectron[0]);
    } else if (atomNum == 79) {
        let valenceElectron = [configuration.pop(), configuration.pop(), configuration.pop()];
        valenceElectron[0][1]++;
        valenceElectron[2][1]--;
        configuration.push(valenceElectron[2], valenceElectron[1], valenceElectron[0]);
    }
    return configuration;
}

function updateElectrons() {
    const configuration = getElectronicConfiguration(atomicNumber);
    const formattedConfiguration = [];
    const electronsInShells = [];
    let index = 1;

    while (configuration.length) {
        let sum = 0;
        for (let i = 0; i < configuration.length; i++) {
            if (Number(configuration[i][0][0]) == index) {
                sum += configuration[i][1];
                formattedConfiguration.push(configuration[i]);
                configuration.splice(i, 1);
                i--;
            }
        }
        electronsInShells.push(sum);
        index++;
    }

    $('.orbits').each((shell, orbit) => {
        if (shell < electronsInShells.length) {
            const orbitRadius = $(orbit).outerWidth() / 2;
            const orbitElectrons = electronsInShells[shell];
            $(orbit).html(
                Array.from({ length: orbitElectrons }, (_, i) => {
                    const angle = (2 * Math.PI / orbitElectrons) * i;
                    const x = orbitRadius * Math.cos(angle);
                    const y = orbitRadius * Math.sin(angle);
                    return `<div class="electron" style="transform: translate(${x}px, ${y}px)" data-electron-shell="${shell + 1}"></div>`;
                }).join('')
            ).css('display', 'flex');
        } else {
            $(orbit).hide();
        }
        if (orbit._tippy) {
            orbit._tippy.destroy();
        }
        tippy(orbit, {
            content: `${String.fromCharCode('K'.charCodeAt(0) + shell)} Shell`,
            placement: 'top',
            followCursor: true,
            delay: [200, 0]
        });
    });
    //updateElectronsTooltips();

    $('#electronic-configuration').html(
        formattedConfiguration.map(([subshell, electrons]) =>
            `<div class="configuration" data-config-shell="${subshell[0]}">
                <span>${subshell}</span>
                <sup>${electrons}</sup>
            </div>`
        ).join('')
    );
}

function updateNucleusToolTip() {
    if (tippyTooltip) {
        tippyTooltip[0].destroy();
    }
    tippyTooltip = tippy('#nucleus', {
        content: elements[atomicNumber - 1].name.full,
        placement: 'top',
        theme: "light",
        followCursor: true,
        delay: [400, 0]
    });
}

function updateElectronsTooltips() {
    $('.electron').each((_, electron) => {
        if (electron._tippy) {
            electron._tippy.destroy();
        }
        tippy(electron, {
            content: `Shell ${$(electron).data('electron-shell')} Electron ${_ + 1}`,
            placement: 'top',
            delay: [100, 0]
        });
    });
}

function highlightConfiguration() {
    $('.orbits').on('mouseenter', function () {
        const shell = $(this).data('orbit');
        const nucleusColor = $('#nucleus').css('background-color');
        $(`.configuration[data-config-shell="${shell}"]`).addClass('highlight');
    }).on('mouseleave', function () {
        const shell = $(this).data('orbit');
        $(`.configuration[data-config-shell="${shell}"]`).removeClass('highlight');
    });
}

function toggleSettingBar() {
    const isFlex = $('#settings').css('display') == 'flex';
    if (isFlex) {
        $('#settings').fadeOut();
        $('#settings label').slideUp();
    } else {
        $('#settings').fadeIn().css('display', 'flex');
        $('#settings label').slideDown();
    }
    $('#toggle-settings i').toggleClass('fa-bars-staggered fa-xmark');
}

function searchElement() {
    const elementName = elements[atomicNumber - 1].name.full;
    const query = encodeURIComponent(elementName);
    const url = `https://en.wikipedia.org/wiki/${query}`;
    window.open(url, '_blank');
}