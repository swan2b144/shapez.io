//Will add in relevant Import classes later when development starts




//IMPORTANT: If anyone wishes to use or modify sHape2O, this file MUST be present.
//Failure to do so will most likely lead to game crashes, as all of the additions
// rely on methods within here.


/*
GetViscosity(): In the future, certain liquids will affect throughput in various ways.
The goal of GetViscosity is to identify what liquid willl be flowing through the pipe, and apply a throughput modifier
as according. Since water will have a default value of 1.0, this method may entirely be pointless or omitted entirely.
However it would be good to have this in place for when I do decide to add alternative fluids.

NetworkIsValid(): MMost likel a boolean check that will vrify that a pipe has a supply point and an end point
If this method returns a false value, any further calcluations are cancelled out until a pipline is deemed valid.
a true value will allow further calculations to be made.







*/