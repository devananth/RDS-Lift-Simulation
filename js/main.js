const userForm = document.getElementById("user_form");
const resetBtn = document.querySelector(".reset-btn");
const backBtn = document.querySelector(".back_btn");
const building = document.querySelector(".building");

/*
{
  liftId : 1,
  currentFloor : 2,
  isOccupied : true | false,
}
*/
let totalLifts = 0;
let totalFloors = 0;
let allLifts = [];
let pendingFloors = [];

userForm.addEventListener("submit", validateUserForm);

resetBtn.addEventListener("click", resetAll);

backBtn.addEventListener("click", () => {
  userForm.style.display = "flex";
  backBtn.style.display = "none";
  resetAll();
});

function resetAll() {
  building.innerHTML = ""; // clearing the building
  allLifts = [];
  pendingFloors = [];
  totalFloors = 0;
  totalLifts = 0;
  userForm.reset();
}

function validateUserForm(event) {
  event.preventDefault();
  const formData = new FormData(userForm);
  const [floorCount, liftCount] = [
    Number(formData.get("totalFloors")),
    Number(formData.get("totalLifts")),
  ];
  if (liftCount <= 0) {
    alert("No.of lifts should greater than 0");
  } else if (floorCount <= 0) {
    alert("No. of Floors should be greater than 0");
  } else if (liftCount > 5) {
    alert("Total lifts should be less than 6");
  } else if (floorCount > 6) {
    alert("Total Floors should be less than 7");
  } else if (liftCount > floorCount) {
    alert("No. of lifts should be lesser than or equal to No. of Floors");
  } else {
    building.innerHTML = ""; // clearing the building
    totalFloors = floorCount;
    totalLifts = liftCount;

    userForm.style.display = "none";
    backBtn.style.display = "flex";

    //Generate building
    generateFloors();
    generateLifts();
  }
}

async function buttonClickHandler(event) {
  const element = event.target;
  const destinationFloor = Number(element.getAttribute("floor-id"));

  // For evaluating only one lift per floor
  const { liftElement, liftId } = checkIsLiftAlreadyPresent(destinationFloor);
  if (liftElement) {
    const liftState = getLiftById(liftId);
    if (!liftState?.isOccupied) {
      updateLiftState(liftElement, liftState.currentFloor, true);
      await handleDoors(liftElement, getLiftById(liftId), destinationFloor);
    }
    return;
  }

  pendingFloors.push(destinationFloor);

  if (isLiftAvailable()) {
    await findLifts();
  }
}

function checkIsLiftAlreadyPresent(destinationFloor) {
  const allLiftElements = document.querySelectorAll(".lift");
  for (const lift of allLiftElements) {
    if (
      lift.style.transform == `translateY(-${(destinationFloor - 1) * 10}rem)`
    ) {
      let liftName = lift.id;
      let liftId = Number(liftName.replace(/\D/g, ""));
      return { liftElement: lift, liftId };
    }
  }
  return { liftElement: null, liftId: null };
}

function generateFloors() {
  for (let i = totalFloors; i >= 1; i--) {
    const floorDiv = document.createElement("div");
    const btnsDiv = document.createElement("div");
    const upBtn = document.createElement("button");
    const downBtn = document.createElement("button");

    floorDiv.className = `floor_container`;
    btnsDiv.className = `floor_btns-container`;

    upBtn.className = `btn`;
    upBtn.textContent = "UP";

    downBtn.className = `btn`;
    downBtn.textContent = "DOWN";

    upBtn.addEventListener("click", buttonClickHandler);
    downBtn.addEventListener("click", buttonClickHandler);

    // Edge Cases
    if (i === totalFloors) {
      upBtn.setAttribute("disabled", true);
    } else if (i === 1) {
      downBtn.setAttribute("disabled", true);
    }

    floorDiv.setAttribute("floor-id", i);
    upBtn.setAttribute("floor-id", i);
    downBtn.setAttribute("floor-id", i);

    btnsDiv.append(upBtn, downBtn);
    floorDiv.append(btnsDiv);
    building.append(floorDiv);
  }
}

function generateLifts() {
  const firstFloor = document.querySelector('[floor-id="1"] ');

  allLifts = [];

  for (let i = 1; i <= totalLifts; i++) {
    let liftContainer = document.createElement("div");
    liftContainer.className = "lift";

    const liftDoors = document.createElement("div");
    liftDoors.className = "lift_doors-container";
    const liftLeftDoor = document.createElement("div");
    const liftRightDoor = document.createElement("div");

    liftLeftDoor.className = "left-door";
    liftRightDoor.className = "right-door";

    liftContainer.id = `lift ${i}`;

    liftDoors.append(liftLeftDoor, liftRightDoor);
    liftContainer.append(liftDoors);

    firstFloor.append(liftContainer);

    allLifts.push({ liftId: i, currentFloor: 1, isOccupied: false });
  }
}

async function findLifts() {
  if (pendingFloors.length > 0) {
    let destinationFloor = pendingFloors.shift();

    if (isLiftAvailable()) {
      const emptyLifts = getAllEmptyLifts();
      const nearestLift = findNearestLift(emptyLifts, destinationFloor);
      const liftElement = document.getElementById(`lift ${nearestLift.liftId}`);

      if (nearestLift.currentFloor === destinationFloor) {
        // same floor just open the door
        //updating lift => occupied
        updateLiftState(nearestLift, nearestLift.currentFloor, true);
        await handleDoors(liftElement, nearestLift, destinationFloor);
      } else {
        await moveLift(liftElement, nearestLift, destinationFloor);
      }
    }
  }
}

function isLiftAvailable() {
  for (let i = 0; i < totalLifts; i++) {
    if (!allLifts[i].isOccupied) {
      return true;
    }
  }
  return false;
}

function getAllEmptyLifts() {
  return allLifts.filter((lift) => !lift?.isOccupied);
}

function getLiftById(liftId) {
  for (let i = 0; i < allLifts.length; i++) {
    if (allLifts[i].liftId === liftId) {
      return allLifts[i];
    }
  }
}

function findNearestLift(allEmptyLifts, destinationFloor) {
  const nearestLifts = allEmptyLifts?.sort(
    (a, b) =>
      Math.abs(a.currentFloor - destinationFloor) -
      Math.abs(b.currentFloor - destinationFloor)
  );
  return nearestLifts[0];
}

function updateLiftState(lift, currentFloor, isOccupied) {
  lift.isOccupied = isOccupied;
  lift.currentFloor = currentFloor;
}

async function moveLift(liftElement, lift, destinationFloor) {
  const diffFloors = Math.abs(lift.currentFloor - destinationFloor);
  //updating lift => occupied
  updateLiftState(lift, lift.currentFloor, (isOccupied = true));

  //moving lift
  liftElement.style.transform = `translateY(-${
    (destinationFloor - 1) * 10
  }rem)`;
  liftElement.style.transition = `all ${diffFloors * 2}s ease`;
  await setDelay(2 * diffFloors);

  //Handling door opening
  await handleDoors(liftElement, lift, destinationFloor);
}

async function handleDoors(liftElement, lift, destinationFloor) {
  const doorsContainer = liftElement.firstChild;
  doorsContainer.classList.add("openLift");
  doorsContainer.classList.remove("closeLift");
  await setDelay(2.5);
  doorsContainer.classList.add("closeLift");
  doorsContainer.classList.remove("openLift");
  await setDelay(2.5);
  //update lift => not occupied
  updateLiftState(lift, destinationFloor, (isOccupied = false));

  if (pendingFloors.length > 0) {
    findLifts();
  }
}

function setDelay(secs) {
  return new Promise((resolve) => setTimeout(resolve, secs * 1000));
}
