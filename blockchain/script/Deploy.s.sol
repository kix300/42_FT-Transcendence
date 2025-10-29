// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// import "forge-std/Script.sol";
// import "../contracts/TournamentRegistry.sol";
import {Script} from "forge-std/Script.sol";
import {TournamentRegistry} from "../contracts/TournamentRegistry.sol";
import {console} from "forge-std/console.sol";

contract DeployScript is Script {
    function run() external {
        vm.startBroadcast();

        TournamentRegistry registry = new TournamentRegistry();

        console.log("TournamentRegistry deployed at:", address(registry));

        vm.stopBroadcast();
    }
}
