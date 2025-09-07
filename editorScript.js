
document.getElementById("mainUI").style.display = "block";

const client = supabase.createClient('https://zzypezedfkegupwpwsam.supabase.co', 'sb_publishable_pasDUaq9bzG0kQkFIvyaeQ_XdvKTBO_')


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

async function qryAvailabilityByID(personID){
  console.log('my personid is: ', personID)
  const {data, error} = await client
    .from('calendar')
    .select()
    .eq('person_id', personID)
    if (error) {
      console.error('qryAvailabilityByID error:', error);
    }
    else{
      console.log('events obtained!');
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
      console.error('qryAvailabilityByID error:', error);
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

console.log(document.getElementById("addPersonButton"));
document.getElementById("addPersonButton").addEventListener("click", addEvent);
document.getElementById("refreshPeopleButton").addEventListener("click", refreshPeopleTable);
document.getElementById("removePersonButton").addEventListener("click", insRemovePersonForm);
document.getElementById("peopleTableBody").addEventListener("click", insRemovePersonShortcut);
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
  people = await qryShowPeople();
  displayPeopleTable(people);

})();

