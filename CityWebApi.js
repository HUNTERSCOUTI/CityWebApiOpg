const apiBaseUrl = "https://cityinfo.buchwaldshave34.dk/api/";
const apiEndpoints = {
    city: "City",
    country: "Country",
    cityLanguage: "CityLanguage",
    language: "Language"
};
const userName = "?UserName=UserZilas";

let cities = [];
let countries = {};
let languages = {};
let cityLanguages = [];

function fetchData(endpoint) {
    return fetch(apiBaseUrl + endpoint + userName)
        .then(response => response.json());
}

function getData() {
    // Sikre at alle bliver fetched før logikken
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
    Promise.all([
        fetchData(apiEndpoints.city),
        fetchData(apiEndpoints.country),
        fetchData(apiEndpoints.cityLanguage),
        fetchData(apiEndpoints.language)
    ])
        .then(([cityData, countryData, cityLanguageData, languageData]) => {
            // City 
            cities = cityData;

            // Country 
            countries = {};
            countryData.forEach(country => {
                countries[country.countryID] = country.countryName;
            });
            document.getElementById('add-coid').innerHTML = '';
            populateOptions("add-coid", countries);

            // CityLanguage
            cityLanguages = cityLanguageData;

            // Languages
            languages = {};
            languageData.forEach(language => {
                languages[language.languageId] = language.languageName;
            });
            document.getElementById('add-lang').innerHTML = '';
            populateOptions("add-lang", languages);

            displayItems(cities);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
}

async function addItem() {
    const addNameTextbox = document.getElementById('add-name');
    const addDescTextbox = document.getElementById('add-desc');
    const addCountryIDTextbox = document.getElementById('add-coid');
    const addLangTextbox = getSelectValues(document.getElementById('add-lang'));

    let data = {
        name: addNameTextbox.value.trim(),
        description: addDescTextbox.value.trim(),
        countryID: addCountryIDTextbox.value.trim()
    };
    
    await fetch(apiBaseUrl + apiEndpoints.city + userName, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
    })
    .then(async response => {
            var cityID = await response.json()
        for (var i = 0; i < addLangTextbox.length; i++) {
            const langItem = {
                cityId: cityID,
                languageId: addLangTextbox[i]
            }
    
            await fetch(`${apiBaseUrl + apiEndpoints.cityLanguage}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(langItem)
            })
        }
    })
    .then(() => {
        getData();
        addNameTextbox.value = '';
        addCountryIDTextbox.value = '';
        addDescTextbox.value = '';
    })
    .catch(error => console.error('Unable to add item.', error));
}

async function updateItem() {
    const itemId = document.getElementById('edit-id').value;
    var languagesAdded = getSelectValues(document.getElementById('edit-lang'));
    
    const item = {
        name: document.getElementById('edit-name').value.trim(),
        description: document.getElementById('edit-desc').value.trim(),
        countryID: document.getElementById('edit-coid').value.trim(),
        cityId: itemId,
    };

    await fetch(`${apiBaseUrl + apiEndpoints.city}/${itemId}` + userName, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    })
    .then(async () => {
        var city = cities.find(city => city.cityId == itemId)

        for (var i = 0; i < city.cityLanguages.length; i++) {
            var language = city.cityLanguages[i];
            if (!languagesAdded.includes(language.languageId)) {
                await fetch(`${apiBaseUrl + apiEndpoints.cityLanguage}/${itemId}%2C%20${language.languageId}?CityId=${itemId}&LanguageId=${language.languageId}`, {
                    method: 'DELETE',
                })
            }
            else {
                var indexToRemove = languagesAdded.findIndex(langId => langId == language.languageId)
                languagesAdded.splice(indexToRemove, 1)
            }
        }

        for (var i = 0; i < languagesAdded.length; i++) {
            const langItem = {
                cityId: itemId,
                languageId: languagesAdded[i]
            }

            await fetch(`${apiBaseUrl + apiEndpoints.cityLanguage}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(langItem)
            })
        }
    })
    .then(() => getData())
    .catch(error => console.error('Unable to update item.', error));
    closeInput();
}

function displayEditForm(id) {
    const item = cities.find(item => item.cityId === id);

    document.getElementById('edit-id').value = item.cityId;
    document.getElementById('edit-name').value = item.name;

    // SELECT KONTROL
    for (const countryId in countries) {
        const option = document.createElement('option');
        option.value = countryId;
        option.textContent = countries[countryId];
        document.getElementById('edit-coid').appendChild(option);
    }

    document.getElementById('edit-desc').value = item.description;

    for (const langId in languages) {
        const option = document.createElement('option');
        option.value = langId;
        option.textContent = languages[langId];
        document.getElementById("edit-lang").appendChild(option);
    }
    document.getElementById('editForm').style.display = 'block';
}

async function deleteItem(id) {
    await fetch(`${apiBaseUrl + apiEndpoints.city}/${id}` + userName, {
        method: 'DELETE'
    })
        .then(() => getData())
        .catch(error => console.error('Unable to delete item.', error));
}

function displayItems(data) {
    const tBody = document.getElementById('display');
    tBody.innerHTML = '';

    displayCount(data.length);

    data.forEach(item => {
        const tr = tBody.insertRow();

        appendCell(tr, countryIDToName(item.countryID));
        appendCell(tr, item.name);
        appendCell(tr, item.description);

        const clang = item.cityLanguages.map(langs => langs.languageName).join(', ');
        appendCell(tr, clang);

        appendButtonCell(tr, 'Edit', () => displayEditForm(item.cityId));
        appendButtonCell(tr, 'Delete', () => deleteItem(item.cityId));
    });
}

function appendCell(row, text) {
    const cell = row.insertCell();
    cell.appendChild(document.createTextNode(text));
}

function appendButtonCell(row, buttonText, clickHandler) {
    const cell = row.insertCell();
    const button = document.createElement('button');
    button.innerText = buttonText;
    button.onclick = clickHandler;
    cell.appendChild(button);
}

function populateOptions(selectName, array) {
    const select = document.getElementById(selectName);
    for (const id in array) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = array[id];
        select.appendChild(option);
    }
}

function getSelectValues(select) {
    const result = [];

    if (select && select.options) {
        for (let i = 0, iLen = select.options.length; i < iLen; i++) {
            const opt = select.options[i];

            if (opt.selected) {
                result.push(
                    parseInt(opt.value)
                );
            }
        }
    }
    return result;
}




function closeInput() {
    document.getElementById('editForm').style.display = 'none';
}

function displayCount(itemCount) {
    const name = (itemCount === 1) ? 'city' : 'cities';

    document.getElementById('counter').innerText = `${itemCount} ${name}`;
}

function addCountryLanguage() {

}

function countryIDToName(ID) {
    return countries[ID] || '';
}

function countryNameToID(name) {
    return countries.find(country => country.countryName === name) || '';
}
