
document.getElementById("mainUI").style.display = "block";
document.getElementById("scheduleFormOutput").style.display = "none";

const client = supabase.createClient('https://zzypezedfkegupwpwsam.supabase.co', 'sb_publishable_pasDUaq9bzG0kQkFIvyaeQ_XdvKTBO_')

let netcalls = 0;
const {data:{session}} = await client.auth.getSession()

if(!session){
const { data, error } = await client.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.href
  }
})
}
else {
    console.log("User logged in:", session.user)
    document.getElementById("buttonDiv").style.display = "none";
    let username = session.user.user_metadata.full_name
    /*document.getElementById("status").innerText = `${username}`;*/
    document.getElementById("status").innerText = `${username}, you are not an authorized user. The functionality on this website will not be available for you.`;

}



async function qryID() {
  netcalls++;
  const { data, error } = await client
    .from('people')
    .select('person_id')
    .eq('email', session.user.user_metadata.email);

  if (error) {
    console.error('Error in qryID:', error);
    return null;
  }

  return data[0].person_id;
}

async function qryRole() {
  netcalls++;
  const { data, error } = await client
    .from('people')
    .select('role')
    .eq('email', session.user.user_metadata.email);

  if (error) {
    console.error('Error in qryRole:', error);
    return null;
  }

  return data[0].role;
}

async function qryRoleByID(personID) {
  netcalls++;
  /*console.log("qryRoleByID called for person: " + personID)*/
  const { data, error } = await client
    .from('people')
    .select('role')
    .eq('person_id', personID);

  if (error) {
    console.error('Error in qryRoleByID:', error);
    return null;
  }

  return data[0].role;
}

async function qryNameByID(personID) {
  netcalls++;
  /*console.log("qryRoleByID called for person: " + personID)*/
  const { data, error } = await client
    .from('people')
    .select('name')
    .eq('person_id', personID);

  if (error) {
    console.error('Error in qryNameByID:', error);
    return null;
  }

  return data[0].name;
}

async function qryAvailabilityByID(personID){
  netcalls++;
  /*console.log('qryAvailabilityByID called. personid is: ', personID)*/
  const {data, error} = await client
    .from('calendar')
    .select()
    .eq('person_id', personID)
    if (error) {
      console.error('qryAvailabilityByID error:', error);
    }
    else{
      /*console.log('events obtained!');*/
      return data;
    }
    ;
}

async function refreshTable(){
  uID = await qryID();
  schedule = await qryAvailabilityByID(uID);
  displayTable(schedule);
}

let uID;
let uRole;
let people;

async function qryShowPeople(){
  console.log('qryShowPeople called')
  const {data, error} = await client
    .from('people')
    .select()
    .order("person_id", { ascending: true });
    if (error) {
      console.error('qryShowPeople error:', error);
    }
    else{
      console.log('people obtained!');
      return data;
    }
    ;
}

function displayPeopleTable(people){
  console.log('displayPeopleTable called with people: ', people)
  let row, name, role, p_id, email;
  let tableBody = document.getElementById("tableBody");
  document.getElementById("peopleTableBody").innerHTML = ``;
  for(let i = 0; i < people.length; i++){
    name = people[i].name;
    role = people[i].role;
    p_id = people[i].person_id;
    email = people[i].email;
    row = `<tr><td><button id="remove${p_id}" type="submit" class="btn btn-primary">Remove</button></td><td>${name}</td><td>${role}</td><td>${p_id}</td><td>${email}</td></tr>`;
    document.getElementById("peopleTableBody").insertAdjacentHTML("beforeend", row);

  }
}

async function refreshPeopleTable(){
  uID = await qryID();
  people = await qryShowPeople(uID);
  displayPeopleTable(people);
}

function insAddPerson(name, role, email){
    client
    .from('people')
    .insert({name: name, role: role, email: email})
    .then(({ error }) => {
      if (error) {
        console.error('insAddPerson error:', error);
      }
      else{
        console.log('person added!');
      }
    });
}

var addEvent = function insAddEventForm(e){
    e.preventDefault();
    const name = document.getElementById("addPersonName").value;
    const email = document.getElementById("addPersonEmail").value;
    const role = document.getElementById("addPersonRole").value;
    insAddPerson(name, role, email);
}

function insRemovePerson(p_id){
  client
    .from('people')
    .delete()
    .eq('person_id', p_id)
    .then(({ error }) => {
      if (error) {
        console.error('insRemovePerson error:', error);
      }
      else{
        console.log('person removed!');
      }
    });
}

function insRemovePersonForm(e){
  e.preventDefault();
  const p_id = document.getElementById("removePersonID").value;
  insRemovePerson(p_id);
}

function insRemovePersonShortcut(e){
  e.preventDefault();
  let target = e.target;
  target = target.id.slice(6);
  console.log(target);
  insRemovePerson(target);
}

const interval = 10

async function evaluateTimeslotByPerson(queryBegin, queryEnd, personID, schedule){
    queryBegin = new Date(queryBegin);
    queryEnd = new Date(queryEnd);
    /*console.log("evaluateTimeslotByPerson called. queryBegin: " + queryBegin + " queryEnd: " + queryEnd + " personID: " + personID)*/
    
    /*console.log("schedule: " + JSON.stringify(schedule));*/
    for(const event of schedule){
        let eventTimeBegin = new Date(event.time_begin);
        let eventTimeEnd = new Date(event.time_end);
        
        /*console.log("event: " + JSON.stringify(event));
        console.log("queryBegin: " + queryBegin + " queryEnd: " + queryEnd);
        console.log("is queryBegin after event begin? " + (queryBegin >= eventTimeBegin));
        console.log("is queryBegin before event end? " + (queryBegin < eventTimeEnd));
        console.log("is queryEnd before event end? " + (queryEnd <= eventTimeEnd));
        console.log("is queryEnd after event begin? " + (queryEnd > eventTimeBegin));*/
        
        if(queryBegin >= eventTimeBegin && queryEnd <= eventTimeEnd){
            /*console.log("query fits perfectly within event!")*/
            return true
        }
        else if(queryBegin >= eventTimeBegin && queryBegin < eventTimeEnd && queryEnd > eventTimeEnd){
            /*console.log("query's start is covered by event!")*/
            return await evaluateTimeslotByPerson(event.time_end, queryEnd, personID, schedule)
        }
        else if(queryBegin <= eventTimeBegin && queryEnd <= eventTimeEnd && queryEnd > eventTimeBegin){
            /*console.log("query's end is covered by event!")*/
            return await evaluateTimeslotByPerson(queryBegin, event.time_begin, personID, schedule)
        }
        else if(queryBegin < eventTimeBegin && queryEnd > eventTimeEnd){
            /*console.log("event fully covered by query; query split in half")*/
            return (await evaluateTimeslotByPerson(queryBegin, event.time_begin, personID, schedule) && await evaluateTimeslotByPerson(event.time_end, queryEnd, personID, schedule))
        }
    }
    return false;
}

async function evaluateTimeslot(queryBegin, queryEnd, peopleAttending, schedules, roles){
    /*console.log("evaluateTimeslot called. peopleAttending: " + peopleAttending)*/
    let editors = 0;
    let contributors = 0;
    let available;
    const peopleAvailable = [];
    for (const person of peopleAttending){
        /*console.log("a person attending is: " + person)*/
        let schedule = schedules[person];
        available = await evaluateTimeslotByPerson(queryBegin, queryEnd, person, schedule);
        /*console.log("available: " + available);*/
        if (roles[person] == 'editor'){
            if(available == false){
                return -1;
            }
            else{
                editors++;
                peopleAvailable.push(person);
            }
        }
        else{
            if(available == true){
                contributors++;
                peopleAvailable.push(person);
            }
        }
    }
    /*console.log("evaluated timeslot");*/
    return [contributors + editors, peopleAvailable];

}

async function getBestTimeslots(e){
    netcalls = 0;
    console.time("QueryTimer");
    e.preventDefault();
    const timesBegin = new Date(document.getElementById("meetingStartTime").value);
    const timesEnd = new Date(document.getElementById("meetingEndTime").value);
    const peopleAttending = document.getElementById("meetingPeople").value.split(",").map(Number);
    const duration = document.getElementById("meetingDuration").value;
    let best = -1
    let bestTime;
    let c;
    let bestPeople;
    const schedules = {};
    const roles = {};
    for (const person of peopleAttending){
        schedules[person] = await qryAvailabilityByID(person);
        roles[person] = await qryRoleByID(person);
    }
    console.log("calling meeting between: " + timesBegin + " and: " + timesEnd);
    console.log("people attending: " + peopleAttending);
    for(let t = new Date(timesBegin); t.getTime() + duration * 60000 <= timesEnd.getTime(); t.setMinutes(t.getMinutes() + interval)){
        /*console.log("for loop called");*/
        let slotStart = new Date(t);
        let slotEnd = new Date(t);
        slotEnd.setTime(slotEnd.getTime() + duration * 60000);
        c = await evaluateTimeslot(slotStart, slotEnd, peopleAttending, schedules, roles);
        /*console.log("at time " + t + ", " + c[0] + " people are attending.");*/
        if(c[0] > best){
            /*console.log("new ABSOLUTE PEAK, updated times")*/
            best = c[0];
            bestTime = new Date(t);
            bestPeople = c[1];
        }
    }
    console.log("the best time is " + bestTime + " with " + best + " people attending: " + bestPeople);
    document.getElementById("scheduleFormOutput").style.display = "block";
    if(best != -1){
    const tbody = document.getElementById("outputTableBody");
    tbody.innerHTML = ``;
    let rows = ``;
    for (const personChosen of bestPeople){
      
      let name = await qryNameByID(personChosen);
      let row = `<tr><td>${name}</td><td>${roles[personChosen]}</td></tr>`;
      rows += row;
    }
    tbody.innerHTML = rows;
    document.getElementById("outputTime").textContent = `The best time for your meeting is ${bestTime.toLocaleString()} with the following people attending:`
  }
  else{
    document.getElementById("outputTime").textContent = `No suitable times were found.`
  }
    console.log(`netcalls: ${netcalls}`);
    console.timeEnd("QueryTimer");
    return [best, bestTime, bestPeople];
    
}

console.log(document.getElementById("addPersonButton"));
document.getElementById("addPersonButton").addEventListener("click", addEvent);
document.getElementById("refreshPeopleButton").addEventListener("click", refreshPeopleTable);
document.getElementById("removePersonButton").addEventListener("click", insRemovePersonForm);
document.getElementById("peopleTableBody").addEventListener("click", insRemovePersonShortcut);
document.getElementById("scheduleMeetingButton").addEventListener("click", getBestTimeslots);
(async () => {
  let username = session.user.user_metadata.full_name
  uID = await qryID();
  
  uRole = await qryRole();
  if(uRole == "editor"){
    document.getElementById("status").innerText = `Welcome editor ${username}!`
    document.getElementById("mainUI").style.display = "block";
  }
  if(uRole == "contributor"){
    document.getElementById("status").innerText = `${username}, you are a contributor to the magazine. Please use the contributor website at ivchroma.github.io/ia-contributor`
  }
  
  console.log('uID:', uID);
  console.log('uRole:', uRole);
  console.log('availabilityByID debug: ', qryAvailabilityByID(4));
  people = await qryShowPeople();
  displayPeopleTable(people);

})();

