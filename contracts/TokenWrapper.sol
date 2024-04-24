// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0

// TokwnWrapper is an ERCO20 token which represents a token or asset from a different network.
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract TokenWrapper is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit {
    constructor(string memory name, string memory symbol)
    ERC20(name, symbol)
    Ownable(_msgSender())
    ERC20Permit(name)
    {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    // Add to supply and owner's wallet
    function increaseWrapped(uint256 amount) public onlyOwner {
        _mint(owner(), amount);
    }

    // Add to supply and designated address
    function increaseWrappedTo(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    // Remove from supply and owner's wallet
    function decreaseWrapped(uint256 amount) public onlyOwner {
        _burn(owner(), amount);
    }

    // Remove from supply and designated address
    function decreaseWrappedFrom(address from, uint256 amount) public onlyOwner {
        _burn(from, amount);
    }

    // The following functions are overrides required by Solidity.
    // Also prevents transfers to and from the contract address
    function _update(address from, address to, uint256 value)
    internal
    override(ERC20, ERC20Pausable)
    {
        if(from == address(this)) {
            revert ERC20InvalidSender(address(this));
        }
        if(to == address(this)) {
        revert ERC20InvalidReceiver(address(this));
        }
        super._update(from, to, value);
    }
}
