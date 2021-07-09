const path = require("path");
//var provider = new Web3.providers.HttpProvider("ipc://./pipe/geth.ipc");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    develop: {
      host: "localhost",
      port: 8545,
      network_id: 15
    },
    nodeth: {
      //provider: provider, 
      host: "localhost",
      port: 8545,
      network_id: 15, // any network associated with your node
      from: "0x478f12e2972ece171f3a9cbb907f0194713ea8c0" //"<deployment account address>"
    }
  },
  compilers: {
    solc: {
      version: "0.8.4"
    }
  }
};
