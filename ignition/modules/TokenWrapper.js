const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("TokenWrapperModule", (m)=> {
    const tokenwrapper = m.contract("TokenWrapper",['Token 1', 'TST']);

    return {tokenwrapper}
})

