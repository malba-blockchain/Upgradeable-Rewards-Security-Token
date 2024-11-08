// Sources flattened with hardhat v2.22.10 https://hardhat.org

// SPDX-License-Identifier: MIT

// File @openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (proxy/utils/Initializable.sol)

pragma solidity ^0.8.20;

/**
 * @dev This is a base contract to aid in writing upgradeable contracts, or any kind of contract that will be deployed
 * behind a proxy. Since proxied contracts do not make use of a constructor, it's common to move constructor logic to an
 * external initializer function, usually called `initialize`. It then becomes necessary to protect this initializer
 * function so it can only be called once. The {initializer} modifier provided by this contract will have this effect.
 *
 * The initialization functions use a version number. Once a version number is used, it is consumed and cannot be
 * reused. This mechanism prevents re-execution of each "step" but allows the creation of new initialization steps in
 * case an upgrade adds a module that needs to be initialized.
 *
 * For example:
 *
 * [.hljs-theme-light.nopadding]
 * ```solidity
 * contract MyToken is ERC20Upgradeable {
 *     function initialize() initializer public {
 *         __ERC20_init("MyToken", "MTK");
 *     }
 * }
 *
 * contract MyTokenV2 is MyToken, ERC20PermitUpgradeable {
 *     function initializeV2() reinitializer(2) public {
 *         __ERC20Permit_init("MyToken");
 *     }
 * }
 * ```
 *
 * TIP: To avoid leaving the proxy in an uninitialized state, the initializer function should be called as early as
 * possible by providing the encoded function call as the `_data` argument to {ERC1967Proxy-constructor}.
 *
 * CAUTION: When used with inheritance, manual care must be taken to not invoke a parent initializer twice, or to ensure
 * that all initializers are idempotent. This is not verified automatically as constructors are by Solidity.
 *
 * [CAUTION]
 * ====
 * Avoid leaving a contract uninitialized.
 *
 * An uninitialized contract can be taken over by an attacker. This applies to both a proxy and its implementation
 * contract, which may impact the proxy. To prevent the implementation contract from being used, you should invoke
 * the {_disableInitializers} function in the constructor to automatically lock it when it is deployed:
 *
 * [.hljs-theme-light.nopadding]
 * ```
 * /// @custom:oz-upgrades-unsafe-allow constructor
 * constructor() {
 *     _disableInitializers();
 * }
 * ```
 * ====
 */
abstract contract Initializable {
    /**
     * @dev Storage of the initializable contract.
     *
     * It's implemented on a custom ERC-7201 namespace to reduce the risk of storage collisions
     * when using with upgradeable contracts.
     *
     * @custom:storage-location erc7201:openzeppelin.storage.Initializable
     */
    struct InitializableStorage {
        /**
         * @dev Indicates that the contract has been initialized.
         */
        uint64 _initialized;
        /**
         * @dev Indicates that the contract is in the process of being initialized.
         */
        bool _initializing;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Initializable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant INITIALIZABLE_STORAGE = 0xf0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00;

    /**
     * @dev The contract is already initialized.
     */
    error InvalidInitialization();

    /**
     * @dev The contract is not initializing.
     */
    error NotInitializing();

    /**
     * @dev Triggered when the contract has been initialized or reinitialized.
     */
    event Initialized(uint64 version);

    /**
     * @dev A modifier that defines a protected initializer function that can be invoked at most once. In its scope,
     * `onlyInitializing` functions can be used to initialize parent contracts.
     *
     * Similar to `reinitializer(1)`, except that in the context of a constructor an `initializer` may be invoked any
     * number of times. This behavior in the constructor can be useful during testing and is not expected to be used in
     * production.
     *
     * Emits an {Initialized} event.
     */
    modifier initializer() {
        // solhint-disable-next-line var-name-mixedcase
        InitializableStorage storage $ = _getInitializableStorage();

        // Cache values to avoid duplicated sloads
        bool isTopLevelCall = !$._initializing;
        uint64 initialized = $._initialized;

        // Allowed calls:
        // - initialSetup: the contract is not in the initializing state and no previous version was
        //                 initialized
        // - construction: the contract is initialized at version 1 (no reininitialization) and the
        //                 current contract is just being deployed
        bool initialSetup = initialized == 0 && isTopLevelCall;
        bool construction = initialized == 1 && address(this).code.length == 0;

        if (!initialSetup && !construction) {
            revert InvalidInitialization();
        }
        $._initialized = 1;
        if (isTopLevelCall) {
            $._initializing = true;
        }
        _;
        if (isTopLevelCall) {
            $._initializing = false;
            emit Initialized(1);
        }
    }

    /**
     * @dev A modifier that defines a protected reinitializer function that can be invoked at most once, and only if the
     * contract hasn't been initialized to a greater version before. In its scope, `onlyInitializing` functions can be
     * used to initialize parent contracts.
     *
     * A reinitializer may be used after the original initialization step. This is essential to configure modules that
     * are added through upgrades and that require initialization.
     *
     * When `version` is 1, this modifier is similar to `initializer`, except that functions marked with `reinitializer`
     * cannot be nested. If one is invoked in the context of another, execution will revert.
     *
     * Note that versions can jump in increments greater than 1; this implies that if multiple reinitializers coexist in
     * a contract, executing them in the right order is up to the developer or operator.
     *
     * WARNING: Setting the version to 2**64 - 1 will prevent any future reinitialization.
     *
     * Emits an {Initialized} event.
     */
    modifier reinitializer(uint64 version) {
        // solhint-disable-next-line var-name-mixedcase
        InitializableStorage storage $ = _getInitializableStorage();

        if ($._initializing || $._initialized >= version) {
            revert InvalidInitialization();
        }
        $._initialized = version;
        $._initializing = true;
        _;
        $._initializing = false;
        emit Initialized(version);
    }

    /**
     * @dev Modifier to protect an initialization function so that it can only be invoked by functions with the
     * {initializer} and {reinitializer} modifiers, directly or indirectly.
     */
    modifier onlyInitializing() {
        _checkInitializing();
        _;
    }

    /**
     * @dev Reverts if the contract is not in an initializing state. See {onlyInitializing}.
     */
    function _checkInitializing() internal view virtual {
        if (!_isInitializing()) {
            revert NotInitializing();
        }
    }

    /**
     * @dev Locks the contract, preventing any future reinitialization. This cannot be part of an initializer call.
     * Calling this in the constructor of a contract will prevent that contract from being initialized or reinitialized
     * to any version. It is recommended to use this to lock implementation contracts that are designed to be called
     * through proxies.
     *
     * Emits an {Initialized} event the first time it is successfully executed.
     */
    function _disableInitializers() internal virtual {
        // solhint-disable-next-line var-name-mixedcase
        InitializableStorage storage $ = _getInitializableStorage();

        if ($._initializing) {
            revert InvalidInitialization();
        }
        if ($._initialized != type(uint64).max) {
            $._initialized = type(uint64).max;
            emit Initialized(type(uint64).max);
        }
    }

    /**
     * @dev Returns the highest version that has been initialized. See {reinitializer}.
     */
    function _getInitializedVersion() internal view returns (uint64) {
        return _getInitializableStorage()._initialized;
    }

    /**
     * @dev Returns `true` if the contract is currently initializing. See {onlyInitializing}.
     */
    function _isInitializing() internal view returns (bool) {
        return _getInitializableStorage()._initializing;
    }

    /**
     * @dev Returns a pointer to the storage namespace.
     */
    // solhint-disable-next-line var-name-mixedcase
    function _getInitializableStorage() private pure returns (InitializableStorage storage $) {
        assembly {
            $.slot := INITIALIZABLE_STORAGE
        }
    }
}


// File @openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract ContextUpgradeable is Initializable {
    function __Context_init() internal onlyInitializing {
    }

    function __Context_init_unchained() internal onlyInitializing {
    }
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}


// File @openzeppelin/contracts/utils/introspection/IERC165.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/IERC165.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-165 standard, as defined in the
 * https://eips.ethereum.org/EIPS/eip-165[ERC].
 *
 * Implementers can declare support of contract interfaces, which can then be
 * queried by others ({ERC165Checker}).
 *
 * For an implementation, see {ERC165}.
 */
interface IERC165 {
    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[ERC section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}


// File @openzeppelin/contracts-upgradeable/utils/introspection/ERC165Upgradeable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/introspection/ERC165.sol)

pragma solidity ^0.8.20;


/**
 * @dev Implementation of the {IERC165} interface.
 *
 * Contracts that want to implement ERC-165 should inherit from this contract and override {supportsInterface} to check
 * for the additional interface id that will be supported. For example:
 *
 * ```solidity
 * function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
 *     return interfaceId == type(MyInterface).interfaceId || super.supportsInterface(interfaceId);
 * }
 * ```
 */
abstract contract ERC165Upgradeable is Initializable, IERC165 {
    function __ERC165_init() internal onlyInitializing {
    }

    function __ERC165_init_unchained() internal onlyInitializing {
    }
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IERC165).interfaceId;
    }
}


// File @openzeppelin/contracts/access/IAccessControl.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (access/IAccessControl.sol)

pragma solidity ^0.8.20;

/**
 * @dev External interface of AccessControl declared to support ERC-165 detection.
 */
interface IAccessControl {
    /**
     * @dev The `account` is missing a role.
     */
    error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

    /**
     * @dev The caller of a function is not the expected one.
     *
     * NOTE: Don't confuse with {AccessControlUnauthorizedAccount}.
     */
    error AccessControlBadConfirmation();

    /**
     * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
     *
     * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
     * {RoleAdminChanged} not being emitted signaling this.
     */
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

    /**
     * @dev Emitted when `account` is granted `role`.
     *
     * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
     * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
     */
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Emitted when `account` is revoked `role`.
     *
     * `sender` is the account that originated the contract call:
     *   - if using `revokeRole`, it is the admin role bearer
     *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
     */
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool);

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {AccessControl-_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32);

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been granted `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     */
    function renounceRole(bytes32 role, address callerConfirmation) external;
}


// File @openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (access/AccessControl.sol)

pragma solidity ^0.8.20;




/**
 * @dev Contract module that allows children to implement role-based access
 * control mechanisms. This is a lightweight version that doesn't allow enumerating role
 * members except through off-chain means by accessing the contract event logs. Some
 * applications may benefit from on-chain enumerability, for those cases see
 * {AccessControlEnumerable}.
 *
 * Roles are referred to by their `bytes32` identifier. These should be exposed
 * in the external API and be unique. The best way to achieve this is by
 * using `public constant` hash digests:
 *
 * ```solidity
 * bytes32 public constant MY_ROLE = keccak256("MY_ROLE");
 * ```
 *
 * Roles can be used to represent a set of permissions. To restrict access to a
 * function call, use {hasRole}:
 *
 * ```solidity
 * function foo() public {
 *     require(hasRole(MY_ROLE, msg.sender));
 *     ...
 * }
 * ```
 *
 * Roles can be granted and revoked dynamically via the {grantRole} and
 * {revokeRole} functions. Each role has an associated admin role, and only
 * accounts that have a role's admin role can call {grantRole} and {revokeRole}.
 *
 * By default, the admin role for all roles is `DEFAULT_ADMIN_ROLE`, which means
 * that only accounts with this role will be able to grant or revoke other
 * roles. More complex role relationships can be created by using
 * {_setRoleAdmin}.
 *
 * WARNING: The `DEFAULT_ADMIN_ROLE` is also its own admin: it has permission to
 * grant and revoke this role. Extra precautions should be taken to secure
 * accounts that have been granted it. We recommend using {AccessControlDefaultAdminRules}
 * to enforce additional security measures for this role.
 */
abstract contract AccessControlUpgradeable is Initializable, ContextUpgradeable, IAccessControl, ERC165Upgradeable {
    struct RoleData {
        mapping(address account => bool) hasRole;
        bytes32 adminRole;
    }

    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    /// @custom:storage-location erc7201:openzeppelin.storage.AccessControl
    struct AccessControlStorage {
        mapping(bytes32 role => RoleData) _roles;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.AccessControl")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant AccessControlStorageLocation = 0x02dd7bc7dec4dceedda775e58dd541e08a116c6c53815c0bd028192f7b626800;

    function _getAccessControlStorage() private pure returns (AccessControlStorage storage $) {
        assembly {
            $.slot := AccessControlStorageLocation
        }
    }

    /**
     * @dev Modifier that checks that an account has a specific role. Reverts
     * with an {AccessControlUnauthorizedAccount} error including the required role.
     */
    modifier onlyRole(bytes32 role) {
        _checkRole(role);
        _;
    }

    function __AccessControl_init() internal onlyInitializing {
    }

    function __AccessControl_init_unchained() internal onlyInitializing {
    }
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControl).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) public view virtual returns (bool) {
        AccessControlStorage storage $ = _getAccessControlStorage();
        return $._roles[role].hasRole[account];
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `_msgSender()`
     * is missing `role`. Overriding this function changes the behavior of the {onlyRole} modifier.
     */
    function _checkRole(bytes32 role) internal view virtual {
        _checkRole(role, _msgSender());
    }

    /**
     * @dev Reverts with an {AccessControlUnauthorizedAccount} error if `account`
     * is missing `role`.
     */
    function _checkRole(bytes32 role, address account) internal view virtual {
        if (!hasRole(role, account)) {
            revert AccessControlUnauthorizedAccount(account, role);
        }
    }

    /**
     * @dev Returns the admin role that controls `role`. See {grantRole} and
     * {revokeRole}.
     *
     * To change a role's admin, use {_setRoleAdmin}.
     */
    function getRoleAdmin(bytes32 role) public view virtual returns (bytes32) {
        AccessControlStorage storage $ = _getAccessControlStorage();
        return $._roles[role].adminRole;
    }

    /**
     * @dev Grants `role` to `account`.
     *
     * If `account` had not been already granted `role`, emits a {RoleGranted}
     * event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleGranted} event.
     */
    function grantRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _grantRole(role, account);
    }

    /**
     * @dev Revokes `role` from `account`.
     *
     * If `account` had been granted `role`, emits a {RoleRevoked} event.
     *
     * Requirements:
     *
     * - the caller must have ``role``'s admin role.
     *
     * May emit a {RoleRevoked} event.
     */
    function revokeRole(bytes32 role, address account) public virtual onlyRole(getRoleAdmin(role)) {
        _revokeRole(role, account);
    }

    /**
     * @dev Revokes `role` from the calling account.
     *
     * Roles are often managed via {grantRole} and {revokeRole}: this function's
     * purpose is to provide a mechanism for accounts to lose their privileges
     * if they are compromised (such as when a trusted device is misplaced).
     *
     * If the calling account had been revoked `role`, emits a {RoleRevoked}
     * event.
     *
     * Requirements:
     *
     * - the caller must be `callerConfirmation`.
     *
     * May emit a {RoleRevoked} event.
     */
    function renounceRole(bytes32 role, address callerConfirmation) public virtual {
        if (callerConfirmation != _msgSender()) {
            revert AccessControlBadConfirmation();
        }

        _revokeRole(role, callerConfirmation);
    }

    /**
     * @dev Sets `adminRole` as ``role``'s admin role.
     *
     * Emits a {RoleAdminChanged} event.
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal virtual {
        AccessControlStorage storage $ = _getAccessControlStorage();
        bytes32 previousAdminRole = getRoleAdmin(role);
        $._roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }

    /**
     * @dev Attempts to grant `role` to `account` and returns a boolean indicating if `role` was granted.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleGranted} event.
     */
    function _grantRole(bytes32 role, address account) internal virtual returns (bool) {
        AccessControlStorage storage $ = _getAccessControlStorage();
        if (!hasRole(role, account)) {
            $._roles[role].hasRole[account] = true;
            emit RoleGranted(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Attempts to revoke `role` to `account` and returns a boolean indicating if `role` was revoked.
     *
     * Internal function without access restriction.
     *
     * May emit a {RoleRevoked} event.
     */
    function _revokeRole(bytes32 role, address account) internal virtual returns (bool) {
        AccessControlStorage storage $ = _getAccessControlStorage();
        if (hasRole(role, account)) {
            $._roles[role].hasRole[account] = false;
            emit RoleRevoked(role, account, _msgSender());
            return true;
        } else {
            return false;
        }
    }
}


// File @openzeppelin/contracts/access/extensions/IAccessControlEnumerable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (access/extensions/IAccessControlEnumerable.sol)

pragma solidity ^0.8.20;

/**
 * @dev External interface of AccessControlEnumerable declared to support ERC-165 detection.
 */
interface IAccessControlEnumerable is IAccessControl {
    /**
     * @dev Returns one of the accounts that have `role`. `index` must be a
     * value between 0 and {getRoleMemberCount}, non-inclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleMember(bytes32 role, uint256 index) external view returns (address);

    /**
     * @dev Returns the number of accounts that have `role`. Can be used
     * together with {getRoleMember} to enumerate all bearers of a role.
     */
    function getRoleMemberCount(bytes32 role) external view returns (uint256);
}


// File @openzeppelin/contracts/utils/structs/EnumerableSet.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/structs/EnumerableSet.sol)
// This file was procedurally generated from scripts/generate/templates/EnumerableSet.js.

pragma solidity ^0.8.20;

/**
 * @dev Library for managing
 * https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive
 * types.
 *
 * Sets have the following properties:
 *
 * - Elements are added, removed, and checked for existence in constant time
 * (O(1)).
 * - Elements are enumerated in O(n). No guarantees are made on the ordering.
 *
 * ```solidity
 * contract Example {
 *     // Add the library methods
 *     using EnumerableSet for EnumerableSet.AddressSet;
 *
 *     // Declare a set state variable
 *     EnumerableSet.AddressSet private mySet;
 * }
 * ```
 *
 * As of v3.3.0, sets of type `bytes32` (`Bytes32Set`), `address` (`AddressSet`)
 * and `uint256` (`UintSet`) are supported.
 *
 * [WARNING]
 * ====
 * Trying to delete such a structure from storage will likely result in data corruption, rendering the structure
 * unusable.
 * See https://github.com/ethereum/solidity/pull/11843[ethereum/solidity#11843] for more info.
 *
 * In order to clean an EnumerableSet, you can either remove all elements one by one or create a fresh instance using an
 * array of EnumerableSet.
 * ====
 */
library EnumerableSet {
    // To implement this library for multiple types with as little code
    // repetition as possible, we write it in terms of a generic Set type with
    // bytes32 values.
    // The Set implementation uses private functions, and user-facing
    // implementations (such as AddressSet) are just wrappers around the
    // underlying Set.
    // This means that we can only create new EnumerableSets for types that fit
    // in bytes32.

    struct Set {
        // Storage of set values
        bytes32[] _values;
        // Position is the index of the value in the `values` array plus 1.
        // Position 0 is used to mean a value is not in the set.
        mapping(bytes32 value => uint256) _positions;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function _add(Set storage set, bytes32 value) private returns (bool) {
        if (!_contains(set, value)) {
            set._values.push(value);
            // The value is stored at length-1, but we add 1 to all indexes
            // and use 0 as a sentinel value
            set._positions[value] = set._values.length;
            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function _remove(Set storage set, bytes32 value) private returns (bool) {
        // We cache the value's position to prevent multiple reads from the same storage slot
        uint256 position = set._positions[value];

        if (position != 0) {
            // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 valueIndex = position - 1;
            uint256 lastIndex = set._values.length - 1;

            if (valueIndex != lastIndex) {
                bytes32 lastValue = set._values[lastIndex];

                // Move the lastValue to the index where the value to delete is
                set._values[valueIndex] = lastValue;
                // Update the tracked position of the lastValue (that was just moved)
                set._positions[lastValue] = position;
            }

            // Delete the slot where the moved value was stored
            set._values.pop();

            // Delete the tracked position for the deleted slot
            delete set._positions[value];

            return true;
        } else {
            return false;
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function _contains(Set storage set, bytes32 value) private view returns (bool) {
        return set._positions[value] != 0;
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function _length(Set storage set) private view returns (uint256) {
        return set._values.length;
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function _at(Set storage set, uint256 index) private view returns (bytes32) {
        return set._values[index];
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function _values(Set storage set) private view returns (bytes32[] memory) {
        return set._values;
    }

    // Bytes32Set

    struct Bytes32Set {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(Bytes32Set storage set, bytes32 value) internal returns (bool) {
        return _add(set._inner, value);
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(Bytes32Set storage set, bytes32 value) internal returns (bool) {
        return _remove(set._inner, value);
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(Bytes32Set storage set, bytes32 value) internal view returns (bool) {
        return _contains(set._inner, value);
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(Bytes32Set storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(Bytes32Set storage set, uint256 index) internal view returns (bytes32) {
        return _at(set._inner, index);
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(Bytes32Set storage set) internal view returns (bytes32[] memory) {
        bytes32[] memory store = _values(set._inner);
        bytes32[] memory result;

        assembly ("memory-safe") {
            result := store
        }

        return result;
    }

    // AddressSet

    struct AddressSet {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(AddressSet storage set, address value) internal returns (bool) {
        return _add(set._inner, bytes32(uint256(uint160(value))));
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(AddressSet storage set, address value) internal returns (bool) {
        return _remove(set._inner, bytes32(uint256(uint160(value))));
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(AddressSet storage set, address value) internal view returns (bool) {
        return _contains(set._inner, bytes32(uint256(uint160(value))));
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(AddressSet storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(AddressSet storage set, uint256 index) internal view returns (address) {
        return address(uint160(uint256(_at(set._inner, index))));
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(AddressSet storage set) internal view returns (address[] memory) {
        bytes32[] memory store = _values(set._inner);
        address[] memory result;

        assembly ("memory-safe") {
            result := store
        }

        return result;
    }

    // UintSet

    struct UintSet {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(UintSet storage set, uint256 value) internal returns (bool) {
        return _add(set._inner, bytes32(value));
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(UintSet storage set, uint256 value) internal returns (bool) {
        return _remove(set._inner, bytes32(value));
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(UintSet storage set, uint256 value) internal view returns (bool) {
        return _contains(set._inner, bytes32(value));
    }

    /**
     * @dev Returns the number of values in the set. O(1).
     */
    function length(UintSet storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

    /**
     * @dev Returns the value stored at position `index` in the set. O(1).
     *
     * Note that there are no guarantees on the ordering of values inside the
     * array, and it may change when more values are added or removed.
     *
     * Requirements:
     *
     * - `index` must be strictly less than {length}.
     */
    function at(UintSet storage set, uint256 index) internal view returns (uint256) {
        return uint256(_at(set._inner, index));
    }

    /**
     * @dev Return the entire set in an array
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function values(UintSet storage set) internal view returns (uint256[] memory) {
        bytes32[] memory store = _values(set._inner);
        uint256[] memory result;

        assembly ("memory-safe") {
            result := store
        }

        return result;
    }
}


// File @openzeppelin/contracts-upgradeable/access/extensions/AccessControlEnumerableUpgradeable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (access/extensions/AccessControlEnumerable.sol)

pragma solidity ^0.8.20;




/**
 * @dev Extension of {AccessControl} that allows enumerating the members of each role.
 */
abstract contract AccessControlEnumerableUpgradeable is Initializable, IAccessControlEnumerable, AccessControlUpgradeable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @custom:storage-location erc7201:openzeppelin.storage.AccessControlEnumerable
    struct AccessControlEnumerableStorage {
        mapping(bytes32 role => EnumerableSet.AddressSet) _roleMembers;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.AccessControlEnumerable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant AccessControlEnumerableStorageLocation = 0xc1f6fe24621ce81ec5827caf0253cadb74709b061630e6b55e82371705932000;

    function _getAccessControlEnumerableStorage() private pure returns (AccessControlEnumerableStorage storage $) {
        assembly {
            $.slot := AccessControlEnumerableStorageLocation
        }
    }

    function __AccessControlEnumerable_init() internal onlyInitializing {
    }

    function __AccessControlEnumerable_init_unchained() internal onlyInitializing {
    }
    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IAccessControlEnumerable).interfaceId || super.supportsInterface(interfaceId);
    }

    /**
     * @dev Returns one of the accounts that have `role`. `index` must be a
     * value between 0 and {getRoleMemberCount}, non-inclusive.
     *
     * Role bearers are not sorted in any particular way, and their ordering may
     * change at any point.
     *
     * WARNING: When using {getRoleMember} and {getRoleMemberCount}, make sure
     * you perform all queries on the same block. See the following
     * https://forum.openzeppelin.com/t/iterating-over-elements-on-enumerableset-in-openzeppelin-contracts/2296[forum post]
     * for more information.
     */
    function getRoleMember(bytes32 role, uint256 index) public view virtual returns (address) {
        AccessControlEnumerableStorage storage $ = _getAccessControlEnumerableStorage();
        return $._roleMembers[role].at(index);
    }

    /**
     * @dev Returns the number of accounts that have `role`. Can be used
     * together with {getRoleMember} to enumerate all bearers of a role.
     */
    function getRoleMemberCount(bytes32 role) public view virtual returns (uint256) {
        AccessControlEnumerableStorage storage $ = _getAccessControlEnumerableStorage();
        return $._roleMembers[role].length();
    }

    /**
     * @dev Return all accounts that have `role`
     *
     * WARNING: This operation will copy the entire storage to memory, which can be quite expensive. This is designed
     * to mostly be used by view accessors that are queried without any gas fees. Developers should keep in mind that
     * this function has an unbounded cost, and using it as part of a state-changing function may render the function
     * uncallable if the set grows to a point where copying to memory consumes too much gas to fit in a block.
     */
    function getRoleMembers(bytes32 role) public view virtual returns (address[] memory) {
        AccessControlEnumerableStorage storage $ = _getAccessControlEnumerableStorage();
        return $._roleMembers[role].values();
    }

    /**
     * @dev Overload {AccessControl-_grantRole} to track enumerable memberships
     */
    function _grantRole(bytes32 role, address account) internal virtual override returns (bool) {
        AccessControlEnumerableStorage storage $ = _getAccessControlEnumerableStorage();
        bool granted = super._grantRole(role, account);
        if (granted) {
            $._roleMembers[role].add(account);
        }
        return granted;
    }

    /**
     * @dev Overload {AccessControl-_revokeRole} to track enumerable memberships
     */
    function _revokeRole(bytes32 role, address account) internal virtual override returns (bool) {
        AccessControlEnumerableStorage storage $ = _getAccessControlEnumerableStorage();
        bool revoked = super._revokeRole(role, account);
        if (revoked) {
            $._roleMembers[role].remove(account);
        }
        return revoked;
    }
}


// File @openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/Pausable.sol)

pragma solidity ^0.8.20;


/**
 * @dev Contract module which allows children to implement an emergency stop
 * mechanism that can be triggered by an authorized account.
 *
 * This module is used through inheritance. It will make available the
 * modifiers `whenNotPaused` and `whenPaused`, which can be applied to
 * the functions of your contract. Note that they will not be pausable by
 * simply including this module, only once the modifiers are put in place.
 */
abstract contract PausableUpgradeable is Initializable, ContextUpgradeable {
    /// @custom:storage-location erc7201:openzeppelin.storage.Pausable
    struct PausableStorage {
        bool _paused;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.Pausable")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant PausableStorageLocation = 0xcd5ed15c6e187e77e9aee88184c21f4f2182ab5827cb3b7e07fbedcd63f03300;

    function _getPausableStorage() private pure returns (PausableStorage storage $) {
        assembly {
            $.slot := PausableStorageLocation
        }
    }

    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    /**
     * @dev The operation failed because the contract is paused.
     */
    error EnforcedPause();

    /**
     * @dev The operation failed because the contract is not paused.
     */
    error ExpectedPause();

    /**
     * @dev Initializes the contract in unpaused state.
     */
    function __Pausable_init() internal onlyInitializing {
        __Pausable_init_unchained();
    }

    function __Pausable_init_unchained() internal onlyInitializing {
        PausableStorage storage $ = _getPausableStorage();
        $._paused = false;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        _requirePaused();
        _;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        PausableStorage storage $ = _getPausableStorage();
        return $._paused;
    }

    /**
     * @dev Throws if the contract is paused.
     */
    function _requireNotPaused() internal view virtual {
        if (paused()) {
            revert EnforcedPause();
        }
    }

    /**
     * @dev Throws if the contract is not paused.
     */
    function _requirePaused() internal view virtual {
        if (!paused()) {
            revert ExpectedPause();
        }
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        PausableStorage storage $ = _getPausableStorage();
        $._paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        PausableStorage storage $ = _getPausableStorage();
        $._paused = false;
        emit Unpaused(_msgSender());
    }
}


// File @openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/ReentrancyGuard.sol)

pragma solidity ^0.8.20;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 *
 * Inheriting from `ReentrancyGuard` will make the {nonReentrant} modifier
 * available, which can be applied to functions to make sure there are no nested
 * (reentrant) calls to them.
 *
 * Note that because there is a single `nonReentrant` guard, functions marked as
 * `nonReentrant` may not call one another. This can be worked around by making
 * those functions `private`, and then adding `external` `nonReentrant` entry
 * points to them.
 *
 * TIP: If EIP-1153 (transient storage) is available on the chain you're deploying at,
 * consider using {ReentrancyGuardTransient} instead.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out our blog post
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul].
 */
abstract contract ReentrancyGuardUpgradeable is Initializable {
    // Booleans are more expensive than uint256 or any type that takes up a full
    // word because each write operation emits an extra SLOAD to first read the
    // slot's contents, replace the bits taken up by the boolean, and then write
    // back. This is the compiler's defense against contract upgrades and
    // pointer aliasing, and it cannot be disabled.

    // The values being non-zero value makes deployment a bit more expensive,
    // but in exchange the refund on every call to nonReentrant will be lower in
    // amount. Since refunds are capped to a percentage of the total
    // transaction's gas, it is best to keep them low in cases like this one, to
    // increase the likelihood of the full refund coming into effect.
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    /// @custom:storage-location erc7201:openzeppelin.storage.ReentrancyGuard
    struct ReentrancyGuardStorage {
        uint256 _status;
    }

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ReentrancyGuard")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ReentrancyGuardStorageLocation = 0x9b779b17422d0df92223018b32b4d1fa46e071723d6817e2486d003becc55f00;

    function _getReentrancyGuardStorage() private pure returns (ReentrancyGuardStorage storage $) {
        assembly {
            $.slot := ReentrancyGuardStorageLocation
        }
    }

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    function __ReentrancyGuard_init() internal onlyInitializing {
        __ReentrancyGuard_init_unchained();
    }

    function __ReentrancyGuard_init_unchained() internal onlyInitializing {
        ReentrancyGuardStorage storage $ = _getReentrancyGuardStorage();
        $._status = NOT_ENTERED;
    }

    /**
     * @dev Prevents a contract from calling itself, directly or indirectly.
     * Calling a `nonReentrant` function from another `nonReentrant`
     * function is not supported. It is possible to prevent this from happening
     * by making the `nonReentrant` function external, and making it call a
     * `private` function that does the actual work.
     */
    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        ReentrancyGuardStorage storage $ = _getReentrancyGuardStorage();
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if ($._status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        $._status = ENTERED;
    }

    function _nonReentrantAfter() private {
        ReentrancyGuardStorage storage $ = _getReentrancyGuardStorage();
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        $._status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        ReentrancyGuardStorage storage $ = _getReentrancyGuardStorage();
        return $._status == ENTERED;
    }
}


// File @openzeppelin/contracts/interfaces/IERC165.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (interfaces/IERC165.sol)

pragma solidity ^0.8.20;


// File @openzeppelin/contracts/token/ERC20/IERC20.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC-20 standard as defined in the ERC.
 */
interface IERC20 {
    /**
     * @dev Emitted when `value` tokens are moved from one account (`from`) to
     * another (`to`).
     *
     * Note that `value` may be zero.
     */
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
     * @dev Emitted when the allowance of a `spender` for an `owner` is set by
     * a call to {approve}. `value` is the new allowance.
     */
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /**
     * @dev Returns the value of tokens in existence.
     */
    function totalSupply() external view returns (uint256);

    /**
     * @dev Returns the value of tokens owned by `account`.
     */
    function balanceOf(address account) external view returns (uint256);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transfer(address to, uint256 value) external returns (bool);

    /**
     * @dev Returns the remaining number of tokens that `spender` will be
     * allowed to spend on behalf of `owner` through {transferFrom}. This is
     * zero by default.
     *
     * This value changes when {approve} or {transferFrom} are called.
     */
    function allowance(address owner, address spender) external view returns (uint256);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * IMPORTANT: Beware that changing an allowance with this method brings the risk
     * that someone may use both the old and the new allowance by unfortunate
     * transaction ordering. One possible solution to mitigate this race
     * condition is to first reduce the spender's allowance to 0 and set the
     * desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     *
     * Emits an {Approval} event.
     */
    function approve(address spender, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the
     * allowance mechanism. `value` is then deducted from the caller's
     * allowance.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Emits a {Transfer} event.
     */
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}


// File @openzeppelin/contracts/interfaces/IERC20.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (interfaces/IERC20.sol)

pragma solidity ^0.8.20;


// File @openzeppelin/contracts/interfaces/IERC1363.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (interfaces/IERC1363.sol)

pragma solidity ^0.8.20;


/**
 * @title IERC1363
 * @dev Interface of the ERC-1363 standard as defined in the https://eips.ethereum.org/EIPS/eip-1363[ERC-1363].
 *
 * Defines an extension interface for ERC-20 tokens that supports executing code on a recipient contract
 * after `transfer` or `transferFrom`, or code on a spender contract after `approve`, in a single transaction.
 */
interface IERC1363 is IERC20, IERC165 {
    /*
     * Note: the ERC-165 identifier for this interface is 0xb0202a11.
     * 0xb0202a11 ===
     *   bytes4(keccak256('transferAndCall(address,uint256)')) ^
     *   bytes4(keccak256('transferAndCall(address,uint256,bytes)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256)')) ^
     *   bytes4(keccak256('transferFromAndCall(address,address,uint256,bytes)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256)')) ^
     *   bytes4(keccak256('approveAndCall(address,uint256,bytes)'))
     */

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from the caller's account to `to`
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferAndCall(address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value) external returns (bool);

    /**
     * @dev Moves a `value` amount of tokens from `from` to `to` using the allowance mechanism
     * and then calls {IERC1363Receiver-onTransferReceived} on `to`.
     * @param from The address which you want to send tokens from.
     * @param to The address which you want to transfer to.
     * @param value The amount of tokens to be transferred.
     * @param data Additional data with no specified format, sent in call to `to`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function transferFromAndCall(address from, address to, uint256 value, bytes calldata data) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value) external returns (bool);

    /**
     * @dev Sets a `value` amount of tokens as the allowance of `spender` over the
     * caller's tokens and then calls {IERC1363Spender-onApprovalReceived} on `spender`.
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     * @param data Additional data with no specified format, sent in call to `spender`.
     * @return A boolean value indicating whether the operation succeeded unless throwing.
     */
    function approveAndCall(address spender, uint256 value, bytes calldata data) external returns (bool);
}


// File @openzeppelin/contracts/utils/Errors.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/Errors.sol)

pragma solidity ^0.8.20;

/**
 * @dev Collection of common custom errors used in multiple contracts
 *
 * IMPORTANT: Backwards compatibility is not guaranteed in future versions of the library.
 * It is recommended to avoid relying on the error API for critical functionality.
 *
 * _Available since v5.1._
 */
library Errors {
    /**
     * @dev The ETH balance of the account is not enough to perform the operation.
     */
    error InsufficientBalance(uint256 balance, uint256 needed);

    /**
     * @dev A call to an address target failed. The target may have reverted.
     */
    error FailedCall();

    /**
     * @dev The deployment failed.
     */
    error FailedDeployment();

    /**
     * @dev A necessary precompile is missing.
     */
    error MissingPrecompile(address);
}


// File @openzeppelin/contracts/utils/Address.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (utils/Address.sol)

pragma solidity ^0.8.20;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev There's no code at `target` (it is not a contract).
     */
    error AddressEmptyCode(address target);

    /**
     * @dev Replacement for Solidity's `transfer`: sends `amount` wei to
     * `recipient`, forwarding all available gas and reverting on errors.
     *
     * https://eips.ethereum.org/EIPS/eip-1884[EIP1884] increases the gas cost
     * of certain opcodes, possibly making contracts go over the 2300 gas limit
     * imposed by `transfer`, making them unable to receive funds via
     * `transfer`. {sendValue} removes this limitation.
     *
     * https://consensys.net/diligence/blog/2019/09/stop-using-soliditys-transfer-now/[Learn more].
     *
     * IMPORTANT: because control is transferred to `recipient`, care must be
     * taken to not create reentrancy vulnerabilities. Consider using
     * {ReentrancyGuard} or the
     * https://solidity.readthedocs.io/en/v0.8.20/security-considerations.html#use-the-checks-effects-interactions-pattern[checks-effects-interactions pattern].
     */
    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert Errors.InsufficientBalance(address(this).balance, amount);
        }

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert Errors.FailedCall();
        }
    }

    /**
     * @dev Performs a Solidity function call using a low level `call`. A
     * plain `call` is an unsafe replacement for a function call: use this
     * function instead.
     *
     * If `target` reverts with a revert reason or custom error, it is bubbled
     * up by this function (like regular Solidity function calls). However, if
     * the call reverted with no returned reason, this function reverts with a
     * {Errors.FailedCall} error.
     *
     * Returns the raw returned data. To convert to the expected return value,
     * use https://solidity.readthedocs.io/en/latest/units-and-global-variables.html?highlight=abi.decode#abi-encoding-and-decoding-functions[`abi.decode`].
     *
     * Requirements:
     *
     * - `target` must be a contract.
     * - calling `target` with `data` must not revert.
     */
    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but also transferring `value` wei to `target`.
     *
     * Requirements:
     *
     * - the calling contract must have an ETH balance of at least `value`.
     * - the called Solidity function must be `payable`.
     */
    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert Errors.InsufficientBalance(address(this).balance, value);
        }
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a delegate call.
     */
    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Tool to verify that a low level call to smart-contract was successful, and reverts if the target
     * was not a contract or bubbling up the revert reason (falling back to {Errors.FailedCall}) in case
     * of an unsuccessful call.
     */
    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            // only check if target is a contract if the call was successful and the return data is empty
            // otherwise we already know that it was a contract
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    /**
     * @dev Tool to verify that a low level call was successful, and reverts if it wasn't, either by bubbling the
     * revert reason or with a default {Errors.FailedCall} error.
     */
    function verifyCallResult(bool success, bytes memory returndata) internal pure returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            return returndata;
        }
    }

    /**
     * @dev Reverts with returndata if present. Otherwise reverts with {Errors.FailedCall}.
     */
    function _revert(bytes memory returndata) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            assembly ("memory-safe") {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert Errors.FailedCall();
        }
    }
}


// File @openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol@v5.1.0

// Original license: SPDX_License_Identifier: MIT
// OpenZeppelin Contracts (last updated v5.1.0) (token/ERC20/utils/SafeERC20.sol)

pragma solidity ^0.8.20;



/**
 * @title SafeERC20
 * @dev Wrappers around ERC-20 operations that throw on failure (when the token
 * contract returns false). Tokens that return no value (and instead revert or
 * throw on failure) are also supported, non-reverting calls are assumed to be
 * successful.
 * To use this library you can add a `using SafeERC20 for IERC20;` statement to your contract,
 * which allows you to call the safe operations as `token.safeTransfer(...)`, etc.
 */
library SafeERC20 {
    /**
     * @dev An operation with an ERC-20 token failed.
     */
    error SafeERC20FailedOperation(address token);

    /**
     * @dev Indicates a failed `decreaseAllowance` request.
     */
    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);

    /**
     * @dev Transfer `value` amount of `token` from the calling contract to `to`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     */
    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }

    /**
     * @dev Transfer `value` amount of `token` from `from` to `to`, spending the approval given by `from` to the
     * calling contract. If `token` returns no value, non-reverting calls are assumed to be successful.
     */
    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

    /**
     * @dev Increase the calling contract's allowance toward `spender` by `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

    /**
     * @dev Decrease the calling contract's allowance toward `spender` by `requestedDecrease`. If `token` returns no
     * value, non-reverting calls are assumed to be successful.
     *
     * IMPORTANT: If the token implements ERC-7674 (ERC-20 with temporary allowance), and if the "client"
     * smart contract uses ERC-7674 to set temporary allowances, then the "client" smart contract should avoid using
     * this function. Performing a {safeIncreaseAllowance} or {safeDecreaseAllowance} operation on a token contract
     * that has a non-zero temporary allowance (for that particular owner-spender) will result in unexpected behavior.
     */
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    /**
     * @dev Set the calling contract's allowance toward `spender` to `value`. If `token` returns no value,
     * non-reverting calls are assumed to be successful. Meant to be used with tokens that require the approval
     * to be set to zero before setting it to a non-zero value, such as USDT.
     *
     * NOTE: If the token implements ERC-7674, this function will not modify any temporary allowance. This function
     * only sets the "standard" allowance. Any temporary allowance will remain active, in addition to the value being
     * set here.
     */
    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    /**
     * @dev Performs an {ERC1363} transferAndCall, with a fallback to the simple {ERC20} transfer if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            safeTransfer(token, to, value);
        } else if (!token.transferAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} transferFromAndCall, with a fallback to the simple {ERC20} transferFrom if the target
     * has no code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * Reverts if the returned value is other than `true`.
     */
    function transferFromAndCallRelaxed(
        IERC1363 token,
        address from,
        address to,
        uint256 value,
        bytes memory data
    ) internal {
        if (to.code.length == 0) {
            safeTransferFrom(token, from, to, value);
        } else if (!token.transferFromAndCall(from, to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Performs an {ERC1363} approveAndCall, with a fallback to the simple {ERC20} approve if the target has no
     * code. This can be used to implement an {ERC721}-like safe transfer that rely on {ERC1363} checks when
     * targeting contracts.
     *
     * NOTE: When the recipient address (`to`) has no code (i.e. is an EOA), this function behaves as {forceApprove}.
     * Opposedly, when the recipient address (`to`) has code, this function only attempts to call {ERC1363-approveAndCall}
     * once without retrying, and relies on the returned value to be true.
     *
     * Reverts if the returned value is other than `true`.
     */
    function approveAndCallRelaxed(IERC1363 token, address to, uint256 value, bytes memory data) internal {
        if (to.code.length == 0) {
            forceApprove(token, to, value);
        } else if (!token.approveAndCall(to, value, data)) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturnBool} that reverts if call fails to meet the requirements.
     */
    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            let success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            // bubble errors
            if iszero(success) {
                let ptr := mload(0x40)
                returndatacopy(ptr, 0, returndatasize())
                revert(ptr, returndatasize())
            }
            returnSize := returndatasize()
            returnValue := mload(0)
        }

        if (returnSize == 0 ? address(token).code.length == 0 : returnValue != 1) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    /**
     * @dev Imitates a Solidity high-level call (i.e. a regular function call to a contract), relaxing the requirement
     * on the return value: the return value is optional (but if data is returned, it must not be false).
     * @param token The token targeted by the call.
     * @param data The call data (encoded using abi.encode or one of its variants).
     *
     * This is a variant of {_callOptionalReturn} that silently catches all reverts and returns a bool instead.
     */
    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        bool success;
        uint256 returnSize;
        uint256 returnValue;
        assembly ("memory-safe") {
            success := call(gas(), token, 0, add(data, 0x20), mload(data), 0, 0x20)
            returnSize := returndatasize()
            returnValue := mload(0)
        }
        return success && (returnSize == 0 ? address(token).code.length > 0 : returnValue == 1);
    }
}


// File contracts/UpgradeableHYAXRewards.sol

// Original license: SPDX_License_Identifier: MIT
pragma solidity ^0.8.20;
/**
 * @dev Implementation based on the whitepaper requirements for rewards distribution
 * Developer: Carlos Alba
 */

 /**
 * @title IHyaxToken based on the SafeERC20 interface
 * @dev Interface for interacting with the HYAX token
 */
interface IHyaxToken is IERC20 {
    function symbol() external view returns (string memory);
}

contract UpgradeableHYAXRewards is AccessControlEnumerableUpgradeable,  PausableUpgradeable, ReentrancyGuardUpgradeable {
    
    // Placeholder to maintain storage compatibility with AccessControlEnumerableUpgradeable
    struct Placeholder {
        uint256 _unused;
    }

    // Required annotation to maintain storage location compatibility
    /// @custom:storage-location erc7201:openzeppelin.storage.AccessControlEnumerable
    Placeholder private _placeholder;

    ////////////////// SMART CONTRACT EVENTS //////////////////
    /**
     * @dev Emitted when funding is added to the contract
     * @param _fundingTypeAdded The type of funding added (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amountAdded The amount of tokens added
     */
    event FundingAdded(FundingType _fundingTypeAdded, uint256 _amountAdded);
    
    /**
     * @dev Emitted when growth tokens are withdrawn
     * @param _walletAddressGrowthTokensWithdrawn The address of the wallet that withdrew the tokens
     * @param _amountWithdrawn The amount of growth tokens withdrawn
     */
    event GrowthTokensWithdrawn(address _walletAddressGrowthTokensWithdrawn, uint256 _amountWithdrawn);

    /**
     * @dev Emitted when team tokens are withdrawn
     * @param _walletAddressTeamTokensWithdrawn The address of the wallet that withdrew the tokens
     * @param _amountWithdrawn The amount of team tokens withdrawn
     */
    event TeamTokensWithdrawn(address _walletAddressTeamTokensWithdrawn, uint256 _amountWithdrawn);

    /**
     * @dev Emitted when reward tokens are withdrawn
     * @param _walletAddressRewardTokensWithdrawn The address of the wallet that withdrew the rewards
     * @param _amountWithdrawn The amount of rewards withdrawn
     */
    event RewardTokensWithdrawn(address _walletAddressRewardTokensWithdrawn, uint256 _amountWithdrawn);

    /**
     * @dev Emitted when tokens are withdrawn to be burned
     * @param _fundingTypeWithdrawn The type of funding (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens withdrawn to be burned
     */
    event TokensToBurnWithdrawn(FundingType _fundingTypeWithdrawn, uint256 _amount);

    /**
     * @dev Emitted when a wallet is added to the whitelist
     * @param _sender The address that added the wallet to the whitelist
     * @param _walletAddress The address of the wallet added to the whitelist
     * @param _isTeamWallet Boolean indicating if the wallet is a team wallet
     * @param _hyaxHoldingAmount The amount of HYAX tokens held by the wallet
     */
    event WalletAddedToWhitelist(address _sender, address _walletAddress, bool _isTeamWallet, uint256 _hyaxHoldingAmount);

    /**
     * @dev Emitted when a wallet whitelist status is updated
     * @param _senderWhitelistStatusUpdated The address that updated the whitelist status
     * @param _walletAddressWhitelistStatusUpdated The address of the wallet 
     * @param _newStatusWhitelistStatusUpdated The new status of the wallet in the whitelist
     */
    event WhitelistStatusUpdated(address _senderWhitelistStatusUpdated, address _walletAddressWhitelistStatusUpdated, bool _newStatusWhitelistStatusUpdated);

    /**
     * @dev Emitted when a wallet blacklist status is updated
     * @param _senderBlacklistStatusUpdated The address that updated the blacklist status
     * @param _walletAddressBlacklistStatusUpdated The address of the wallet 
     * @param _newStatusBlacklistStatusUpdated The new status of the wallet in the blacklist
     */
    event BlacklistStatusUpdated(address _senderBlacklistStatusUpdated, address _walletAddressBlacklistStatusUpdated, bool _newStatusBlacklistStatusUpdated);

    /**
     * @dev Emitted when a reward update is successful for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update was successful
     * @param _hyaxReward The amount of HYAX rewards updated for the wallet
     */
    event RewardUpdateSuccess(address _sender, address _walletAddress, uint256 _hyaxReward);
 
    /**
     * @dev Emitted when a reward update batch is sent
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddresses The addresses of the wallets sent for the update
     * @param _hyaxRewards The amount of HYAX rewards sent for the update
     */
    event RewardUpdateBatchSent(address _sender, address[] _walletAddresses, uint256[] _hyaxRewards);

    /**
     * @dev Emitted when a reward update fails for a specific wallet
     * @param _sender The address that attempted to update the rewards
     * @param _walletAddress The address of the wallet for which the update failed
     * @param _errorMessage A string describing the reason for the failure
     */
    event RewardUpdateFailed(address _sender, address _walletAddress, string _errorMessage);

    /**
     * @dev Emitted when a team member wallet is updated
     * @param _oldTeamMemberWalletAddress The address of the old team member wallet
     * @param _newTeamMemberWalletAddress The address of the new team member wallet
     */
    event TeamMemberWalletUpdated(address _oldTeamMemberWalletAddress, address _newTeamMemberWalletAddress, 
        uint256 _hyaxHoldingAmount);

    /**
     * @dev Emitted when the white lister address is updated
     * @param _newWhiteListerAddress The address of the new white lister
     */
    event WhiteListerAddressUpdated(address _newWhiteListerAddress);

    /**
     * @dev Emitted when the rewards updater address is updated
     * @param _newRewardsUpdaterAddress The address of the new rewards updater
     */
    event RewardsUpdaterAddressUpdated(address _newRewardsUpdaterAddress);

    /**
     * @dev Emitted when the hyax token address is updated
     * @param _hyaxTokenAddress The address of the new hyax token
     */
    event HyaxTokenAddressUpdated(address _hyaxTokenAddress);

    /**
     * @dev Emitted when the maximum batch size for update rewards is updated
     * @param _maximumBatchSizeForUpdateRewards The new maximum batch size for update rewards
     */
    event MaximumBatchSizeForUpdateRewardsUpdated(uint8 _maximumBatchSizeForUpdateRewards);

    ////////////////// SMART CONTRACT VARIABLES & CONSTANTS //////////////////

    address public hyaxTokenAddress; // Address of the HYAX token

    IHyaxToken public hyaxToken; // Instance of the HYAX token

    enum FundingType {GrowthTokens, TeamTokens, RewardTokens} // Enum to identify the type of funding

    uint256 public constant MIN_INTERVAL_FOR_UPDATE_REWARDS = 6 days; // Minimum interval for update rewards    

    bytes32 public constant REWARDS_UPDATER_ROLE = keccak256("REWARDS_UPDATER_ROLE"); // Role for the rewards updater

    bytes32 public constant WHITELISTER_ROLE = keccak256("WHITELISTER_ROLE"); // Role for the whitelister

    ////////////////// GROWTH TOKENS VARIABLES //////////////////

    uint256 public constant GROWTH_TOKENS_TOTAL = 2400000000 * 10**18; // Total of 2.4 Billion growth tokens. 60% of 4B.
    
    uint256 public constant GROWTH_TOKENS_WITHDRAWAL_PER_YEAR = 120000000 * 10**18; // 120 Million tokens per year

    uint256 public constant TOKENS_WITHDRAWAL_PERIOD = 365 days; // 1 year

    uint256 public growthTokensFunded; // Total amount of growth tokens funded to the contract

    uint256 public growthTokensWithdrawn; // Total amount of growth tokens withdrawn from the contract

    uint256 public growthTokensInSmartContract; // Current balance of growth tokens in the contract

    uint256 public growthTokensLastWithdrawalTime; // Timestamp of the last growth tokens withdrawal

    uint256 public growthTokensStartFundingTime; // Timestamp when growth tokens funding started

    bool public growthTokensFundingStarted; // Flag to indicate if growth tokens funding has begun


    ////////////////// TEAM TOKENS VARIABLES //////////////////

    uint256 public constant TEAM_TOKENS_TOTAL = 1500000000 * 10**18; // Total of 1.5 Billion as team tokens
    
    uint256 public constant TEAM_TOKENS_WITHDRAWAL_PER_YEAR = 300000000 * 10**18; // 300 Million tokens per year

    uint256 public constant TEAM_TOKENS_LOCKED_PERIOD = 1460 days; // 4 years

    uint256 public teamTokensFunded; // Total amount of team tokens funded to the contract

    uint256 public teamTokensWithdrawn; // Total amount of team tokens withdrawn from the contract

    uint256 public teamTokensInSmartContract; // Current balance of team tokens in the contract

    uint256 public teamTokensStartFundingTime; // Timestamp when team tokens funding started

    bool public teamTokensFundingStarted; // Flag to indicate if team tokens funding has begun

    
    ////////////////// REWARD TOKENS VARIABLES //////////////////

    uint256 public constant REWARD_TOKENS_TOTAL = 1200000000 * 10**18; // Total of 1.2 Billion as reward tokens
    
    uint256 public constant REWARD_TOKENS_PER_YEAR = 150000000 * 10**18; // 150 Million tokens per year

    uint256 public constant REWARD_TOKENS_PER_WEEK =  REWARD_TOKENS_PER_YEAR / 52; // 150 Million tokens divided by 52 weeks

    uint256 public rewardTokensFunded; // Total amount of reward tokens funded to the contract

    uint256 public rewardTokensDistributed; // Total amount of reward tokens distributed to the wallets 

    uint256 public rewardTokensWithdrawn; // Total amount of reward tokens withdrawn from the contract

    uint256 public rewardTokensInSmartContract; // Current balance of reward tokens in the contract

    uint256 public rewardTokensStartFundingTime; // Timestamp when team tokens funding started

    bool public rewardTokensFundingStarted; // Flag to indicate if team tokens funding has begun

    ////////////////// DATA VARIABLES & MAPPINGS //////////////////
   
    address public whiteListerAddress; // Address of the whitelister

    address public rewardsUpdaterAddress; // Address of the rewards updater

    struct WalletData {
        uint256 hyaxHoldingAmount;                  // Current amount of HYAX tokens held by the wallet
        uint256 hyaxHoldingAmountAtWhitelistTime;   // Amount of HYAX tokens held when the wallet was whitelisted. Useful for the team wallets

        uint256 totalHyaxRewardsAmount;             // Total amount of HYAX rewards earned by the wallet
        uint256 currentRewardsAmount;               // Current amount of rewards available for withdrawal
        uint256 rewardsWithdrawn;                   // Total amount of rewards withdrawn by the wallet
        
        uint256 addedToWhitelistTime;               // Timestamp when the wallet was added to the whitelist
        uint8 teamTokenWithdrawalTimes;            // Times that there have been a team token withdrawal
        uint256 lastRewardsWithdrawalTime;          // Timestamp of the last rewards withdrawal
        uint256 lastRewardsUpdateTime;              // Timestamp of the last rewards update

        bool isTeamWallet;                          // Flag indicating if this is a team wallet
        bool isWhitelisted;                         // Flag indicating if the wallet is whitelisted
        bool isBlacklisted;                         // Flag indicating if the wallet is blacklisted
    }
    
    uint8 public maximumBatchSizeForUpdateRewards; // Maximum batch size for update rewards
    
    mapping(address => WalletData) public wallets; // Mapping to store wallet data

    uint256[50] private __gap; // Array to store unused space for future upgrades

    ////////////////// SMART CONTRACT CONSTRUCTOR /////////////////

    /**
     * @dev Initializer function instead of constructor.
     * This function will initialize the contract's state variables and call initializers for inherited contracts.
     */
    function initialize(address _hyaxTokenAddress) public initializer {

        // Initialize inherited contracts
        __AccessControlEnumerable_init(); 
        __ReentrancyGuard_init();
        __Pausable_init();

        //Grant the default admin role to the admin
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Set up the whitelister address
        whiteListerAddress = 0x01c2f012de19e6436744c3F81f56E9e70C93a8C3;

        // Add whitelister role to the whitelister address
        _grantRole(WHITELISTER_ROLE, whiteListerAddress);

        // Set up the rewards updater address
        rewardsUpdaterAddress = 0x01c2f012de19e6436744c3F81f56E9e70C93a8C3;

        // Add rewards updater role to the rewards updater address
        _grantRole(REWARDS_UPDATER_ROLE, rewardsUpdaterAddress);

        // Set the HYAX token address
        hyaxTokenAddress = _hyaxTokenAddress;

        // Create an instance of the HYAX token
        hyaxToken = IHyaxToken(hyaxTokenAddress);

        // Set the initial values for growth tokens to prevent Uninitialized State Variable errors
        growthTokensFunded = 0;
        growthTokensWithdrawn = 0;
        growthTokensInSmartContract = 0;
        growthTokensLastWithdrawalTime = 0;
        growthTokensStartFundingTime = 0;
        growthTokensFundingStarted = false;

        // Set the initial values for team tokens to prevent Uninitialized State Variable errors
        teamTokensFunded = 0;
        teamTokensWithdrawn = 0;
        teamTokensInSmartContract = 0;
        teamTokensStartFundingTime = 0;
        teamTokensFundingStarted = false;

        // Set the initial values for reward tokens to prevent Uninitialized State Variable errors
        rewardTokensFunded = 0;
        rewardTokensDistributed = 0;
        rewardTokensWithdrawn = 0;
        rewardTokensInSmartContract = 0;
        rewardTokensStartFundingTime = 0;
        rewardTokensFundingStarted = false;
        
        // Set the initial maximum batch size for update rewards
        maximumBatchSizeForUpdateRewards = 100;

        //Validate that the hyax token is valid based on the symbol
        require(keccak256(abi.encodePacked(hyaxToken.symbol())) == keccak256(abi.encodePacked("HYAX"))  , "Hyax token address is not valid");
    }

    ////////////////// SMART CONTRACT FUNCTIONS //////////////////
    /**
     * @notice Adds a wallet to the whitelist
     * @dev This function allows the owner or the whitelister address to add a wallet to the whitelist
     * @param _walletAddress The address of the wallet to be added to the whitelist
     * @param _isTeamWallet A boolean indicating if the wallet is a team wallet
     */
    function addWalletToWhitelist(address _walletAddress, bool _isTeamWallet, uint256 _hyaxHoldingAmountAtWhitelistTime) onlyAdminOrWhitelister public {
        
        // Validate the wallet address and its whitelist status
        require(_walletAddress != address(0), "Address cannot be the zero address");
        require(address(_walletAddress).code.length == 0, "Invalid address length or contract address");
        require(!wallets[_walletAddress].isWhitelisted, "Wallet is already whitelisted");
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");
        require(wallets[_walletAddress].addedToWhitelistTime == 0, "Wallet has already been added to the whitelist");
        
        //Add the wallet to the whitelist with the provided parameters
        wallets[_walletAddress].isWhitelisted = true; // Mark the wallet as whitelisted
        wallets[_walletAddress].isBlacklisted = false; // Mark the wallet as not blacklisted
        wallets[_walletAddress].isTeamWallet = _isTeamWallet; // Set whether this is a team wallet or not

        wallets[_walletAddress].addedToWhitelistTime = block.timestamp; // Set the time when the wallet was added to the whitelist
        
        wallets[_walletAddress].teamTokenWithdrawalTimes = 0; // Initialize the token withdrawal times to zero
        wallets[_walletAddress].lastRewardsWithdrawalTime = 0; // Initialize the last rewards withdrawal time to zero
        
        wallets[_walletAddress].currentRewardsAmount = 0; // Initialize the current rewards amount to zero
        wallets[_walletAddress].totalHyaxRewardsAmount = 0; // Set the total HYAX rewards amount to zero
        wallets[_walletAddress].rewardsWithdrawn = 0; // Initialize the rewards withdrawn to zero

        if(_isTeamWallet){
            require(_hyaxHoldingAmountAtWhitelistTime > 0, "Team wallets must be added with a hyax holding amount greater than 0");
            require(_hyaxHoldingAmountAtWhitelistTime <= TEAM_TOKENS_TOTAL, "Team wallets must be added with a hyax holding amount less than the total team tokens");
            wallets[_walletAddress].hyaxHoldingAmountAtWhitelistTime = _hyaxHoldingAmountAtWhitelistTime; // Set the wallet's HYAX holding amount
            wallets[_walletAddress].hyaxHoldingAmount = _hyaxHoldingAmountAtWhitelistTime; // Set the wallet's HYAX holding amount
        }
        else {
            require(_hyaxHoldingAmountAtWhitelistTime == 0, "Non team wallets can only be added with holding amount equal to 0");
            wallets[_walletAddress].hyaxHoldingAmountAtWhitelistTime = 0; // Set the wallet's HYAX holding amount
            wallets[_walletAddress].hyaxHoldingAmount = 0; // Set the wallet's HYAX holding amount
        }

        // Final validation of the wallet whitelist status
        require(wallets[_walletAddress].isWhitelisted == true && wallets[_walletAddress].addedToWhitelistTime != 0, "Failed to whitelist the wallet");

        //Emit an event to notify that the wallet was added to the whitelist
        emit WalletAddedToWhitelist(msg.sender, _walletAddress, _isTeamWallet, _hyaxHoldingAmountAtWhitelistTime);
    }
    
    /**
     * @notice Updates the status of a wallet in the whitelist
     * @dev This function allows the owner or the whitelister address to update the status of a wallet in the whitelist
     * @param _walletAddress The address of the wallet to be updated
     */ 
    function updateWhitelistStatus(address _walletAddress, bool _newStatus) onlyAdminOrWhitelister public {
        
        //Verify that the wallet is currently in a different status and the wallet has been added to the whitelist
        require(wallets[_walletAddress].isWhitelisted != _newStatus, "Wallet has already been updated to that status");
        require(wallets[_walletAddress].addedToWhitelistTime != 0, "Wallet has not been added to the whitelist");

        //Update the whitelist status
        wallets[_walletAddress].isWhitelisted = _newStatus; 

        //Emit an event to notify that the wallet whitelist status has been updated
        emit WhitelistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }

    /**
     * @notice Updates the status of a wallet in the blacklist
     * @dev This function allows the owner or the whitelister address to update the status of a wallet in the blacklist
     * @param _walletAddress The address of the wallet to be updated
     */ 
    function updateBlacklistStatus(address _walletAddress, bool _newStatus) onlyAdminOrWhitelister public {
        
        //Verify that the wallet is currently in a different status
        require(wallets[_walletAddress].isBlacklisted != _newStatus, "Wallet has already been updated to that status");

        //Update the blacklist status
        wallets[_walletAddress].isBlacklisted = _newStatus; 

        //If the wallet blacklist new status is true (add to blacklist), set the whitelist status to false (remove from whitelist)
        if(_newStatus == true){ wallets[_walletAddress].isWhitelisted = false; }

        //Emit an event to notify that the wallet blacklisted status has been updated
        emit BlacklistStatusUpdated(msg.sender, _walletAddress, _newStatus);
    }

    /**
     * @notice Funds the smart contract with tokens for different purposes
     * @dev This function can only be called by the contract owner
     * @param _fundingType The type of funding (GrowthTokens, TeamTokens, or RewardTokens)
     * @param _amount The amount of tokens to fund
     * @custom:events Emits a FundingAdded event upon successful funding
     */
    function fundSmartContract(FundingType _fundingType, uint256 _amount) onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() isNotPaused() public {

        // Validate the funding request
        require(msg.sender == owner(), "Only the owner can fund the smart contract");
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamTokens || _fundingType == FundingType.RewardTokens, "Invalid funding type");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Transfer the specified token to this contract
        require(hyaxToken.transferFrom(msg.sender, address(this), _amount), "There was an error on receiving the token funding");

        // Add the amount to the corresponding token
        if (_fundingType == FundingType.GrowthTokens) {
            //Require that the amount is less than the total growth tokens
            require(growthTokensFunded + _amount <= GROWTH_TOKENS_TOTAL, "Amount to fund is greater than the total intented for growth tokens");

            // Increase the total amount of growth tokens funded
            growthTokensFunded += _amount;

            // Increase the current balance of growth tokens in the smart contract
            growthTokensInSmartContract += _amount;
        
            // If growth tokens funding has not started yet, start it
            if (!growthTokensFundingStarted) {
                growthTokensFundingStarted = true; // Set the funding started flag to true
                growthTokensStartFundingTime = block.timestamp; // Start the funding time
                growthTokensLastWithdrawalTime = block.timestamp; // Initialize withdrawal time
            }
            
        } else if (_fundingType == FundingType.TeamTokens) {
            //Require that the amount is less than the total growth tokens
            require(teamTokensFunded + _amount <= TEAM_TOKENS_TOTAL, "Amount to fund is greater than the total intented for team tokens");
            
            // Increase the total amount of team tokens funded
            teamTokensFunded += _amount;

            // Increase the current balance of team tokens tokens in the smart contract
            teamTokensInSmartContract += _amount;

            // If team tokens funding has not started yet, start it
            if (!teamTokensFundingStarted) {
                teamTokensFundingStarted = true; // Set the funding started flag to true
                teamTokensStartFundingTime = block.timestamp; // Start the funding time
            }

        } else if (_fundingType == FundingType.RewardTokens) {
            //Require that the amount is less than the total growth tokens
            require(rewardTokensFunded + _amount <= REWARD_TOKENS_TOTAL, "Amount to fund is greater than the total intented for reward tokens");

            //Increase the total amount of reward tokens funded
            rewardTokensFunded += _amount;

            // Increase the current balance of reward tokens tokens in the smart contract
            rewardTokensInSmartContract += _amount;

            // If reward tokens funding has not started yet, start it
            if (!rewardTokensFundingStarted) {
                rewardTokensFundingStarted = true; // Set the funding started flag to true
                rewardTokensStartFundingTime = block.timestamp; // Start the funding time
            }
        }
        // Emit an event to notify that the funding was successful
        emit FundingAdded(_fundingType, _amount);
    }

    modifier onlyAdminOrWhitelister {
        // Ensure that the sender is the owner or the whitelister address
        require(hasRole(WHITELISTER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender)  , "Function reserved only for the whitelister or the owner");
        _;
    }

    modifier onlyAdminOrRewardsUpdater {
        // Ensure that the sender is the owner, the rewards updater address or the contract itself
        require(hasRole(REWARDS_UPDATER_ROLE, msg.sender) || hasRole(DEFAULT_ADMIN_ROLE, msg.sender) || msg.sender == address(this), "Function reserved only for the rewards updater, the owner, or the contract itself");
        _;
    }

    modifier isWhitelisted(address _walletAddress) {
        // Ensure that the sender is the owner or the white lister address
        require(wallets[_walletAddress].isWhitelisted == true, "Wallet is not whitelisted");
        _;
    }

    modifier isNotBlacklisted(address _walletAddress) {
        // Ensure that the sender is the owner or the white lister address
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");
        _;
    }

    modifier isNotPaused() {
        // Ensure that the smart contract is not paused
        require(paused() == false, "Contract is paused");
        _;
    }
    
    /////////////GROWTH TOKENS FUNCTIONS///////////
    /**
     * @notice Allows the owner to withdraw growth tokens
     * @dev This function can only be called by the contract owner
     * @dev Withdrawals are limited to once per year and a fixed amount per withdrawal
     * @dev The function checks various conditions before allowing the withdrawal
     * @custom:requirements Only the owner can withdraw growth tokens
     * @custom:requirements Funding must have started
     * @custom:requirements At least one year must have passed since funding start
     * @custom:requirements Not all growth tokens have been withdrawn
     * @custom:requirements At least one year has passed since the last withdrawal
     * @custom:events Emits a GrowthTokensWithdrawn event upon successful withdrawal
     */
    function withdrawGrowthTokens() onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() isNotPaused() public {

        // Validate the conditions for growth tokens withdrawal
        require(msg.sender == owner(), "Only the owner can withdraw growth tokens");
        require(growthTokensFundingStarted, "Growth tokens funding has not started yet, no tokens to withdraw");
        require(block.timestamp >= growthTokensStartFundingTime + TOKENS_WITHDRAWAL_PERIOD , "Cannot withdraw before 1 year after funding start");
        require(growthTokensWithdrawn < GROWTH_TOKENS_TOTAL, "All growth tokens have been withdrawn");
        require(block.timestamp >= growthTokensLastWithdrawalTime + TOKENS_WITHDRAWAL_PERIOD, "Can only withdraw once per year");
        
        // Set the initial withdrawable amount to the yearly withdrawal limit
        uint256 withdrawableAmount = GROWTH_TOKENS_WITHDRAWAL_PER_YEAR;
        
        // Check if withdrawing the full yearly amount would exceed the total growth tokens
        uint256 totalWithdrawn = growthTokensWithdrawn + withdrawableAmount;

        // If so, adjust the withdrawable amount to the remaining balance
        if (totalWithdrawn > GROWTH_TOKENS_TOTAL) { withdrawableAmount = GROWTH_TOKENS_TOTAL - growthTokensWithdrawn; }
        
        // Update the growth tokens withdrawn amount
        growthTokensWithdrawn += withdrawableAmount;

        // Update the growth tokens in the smart contract
        growthTokensInSmartContract -= withdrawableAmount;

        // Update the last withdrawal time
        growthTokensLastWithdrawalTime = block.timestamp;

        // Transfer the calculated amount to the owner
        require(hyaxToken.transfer(owner(), withdrawableAmount), "Failed to transfer growth tokens");

        // Emit an event to notify that the growth tokens were withdrawn    
        emit GrowthTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /////////////TEAM TOKENS FUNCTIONS///////////

    /**
     * @notice Allows team members to withdraw their allocated tokens
     * @dev This function can only be called by whitelisted team wallets
     * @dev Withdrawals are limited to once per year and a fixed amount per withdrawal
     * @dev The function checks various conditions before allowing the withdrawal
     * @custom:requirements Caller must be a whitelisted team wallet
     * @custom:requirements Team tokens funding must have started
     * @custom:requirements At least four years must have passed since the wallet was added to the whitelist
     * @custom:requirements At least one year must have passed since the last withdrawal
     * @custom:requirements Not all team tokens have been withdrawn
     * @custom:requirements The wallet must have a positive HYAX holding amount
     * @custom:events Emits a TeamTokensWithdrawn event upon successful withdrawal
     */
    function withdrawTeamTokens() isWhitelisted(msg.sender) isNotBlacklisted(msg.sender) nonReentrant() isNotPaused() public {

        // Validate the conditions for team tokens withdrawal
        require(wallets[msg.sender].isTeamWallet == true, "Only team wallets can withdraw tokens using this function");
        require(teamTokensFundingStarted, "Team tokens funding has not started yet, no tokens to withdraw");
        require(block.timestamp >= wallets[msg.sender].addedToWhitelistTime + TEAM_TOKENS_LOCKED_PERIOD , "Cannot withdraw before 4 years after being added to the whitelist");
        require(teamTokensWithdrawn < TEAM_TOKENS_TOTAL, "All team tokens have been withdrawn");
        require(wallets[msg.sender].hyaxHoldingAmount > 0, "No hyax holding amount to withdraw");
        require(wallets[msg.sender].teamTokenWithdrawalTimes <  calculateYearForTeamTokens(), "Can only withdraw team tokens once per year");

        // Set the initial withdrawable amount to the limit per year (20% of the hyax holding amount at whitelist time) 
        uint256 withdrawableAmount = wallets[msg.sender].hyaxHoldingAmountAtWhitelistTime / 5;
        
        // Check if withdrawing the yearly amount would exceed the total team tokens
        if (teamTokensWithdrawn + withdrawableAmount > TEAM_TOKENS_TOTAL) {
            // If so, adjust the withdrawable amount to the remaining balance
            withdrawableAmount = TEAM_TOKENS_TOTAL - teamTokensWithdrawn;
        }

        //Update the hyax holding amount
        wallets[msg.sender].hyaxHoldingAmount -= withdrawableAmount;

        // Update the team tokens withdrawn amount
        teamTokensWithdrawn += withdrawableAmount;

        // Update the team tokens in the smart contract
        teamTokensInSmartContract -= withdrawableAmount;

        //Increase the times that the team member has done a token withdrawal
        wallets[msg.sender].teamTokenWithdrawalTimes ++;
    
        // Transfer the calculated amount to the wallet
        require(hyaxToken.transfer(msg.sender, withdrawableAmount), "Failed to transfer team tokens");

        // Emit an event to notify that the team tokens were withdrawn    
        emit TeamTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /**
     * @notice Calculates the year for team tokens based on the funding start time
     * @dev This function calculates the year for team tokens based on the funding start time
     * @return The year for team tokens as a uint8
     */
    function calculateYearForTeamTokens() public view returns (uint8) {
        // Check if team tokens funding has started
        require(teamTokensFundingStarted, "Team tokens funding has not started yet");

        // Calculate the time elapsed since the funding start time
        uint256 timeElapsed = block.timestamp - teamTokensStartFundingTime;
        uint256 yearsElapsed = timeElapsed / 365 days;

        // Ensure the maximum year cap is respected
        if (yearsElapsed >= 8) {
            return 5; // Year 8 and beyond can withdraw
        } else if (yearsElapsed >= 7) {
            return 4; // Year 7 can withdraw
        } else if (yearsElapsed >= 6) {
            return 3; // Year 6 can withdraw
        } else if (yearsElapsed >= 5) {
            return 2; // Year 5 can withdraw
        } else if (yearsElapsed >= 4) {
            return 1; // Year 4 can withdraw
        } else {
            return 0; // Less than 4 years elapsed
        }
    }
    
    /////////////REWARD TOKENS FUNCTIONS///////////

    /**
     * @notice Updates the rewards for a batch of wallets
     * @dev This function updates the rewards for a list of wallets in a single transaction.
     * @param _walletAddresses The list of wallet addresses to update rewards for.
     * @param _hyaxRewards The list of HYAX rewards to be updated for each wallet.
     */
    function updateRewardsBatch(address[] calldata _walletAddresses, uint256[] calldata _hyaxRewards) public onlyAdminOrRewardsUpdater nonReentrant {
        
        //Validate the conditions for batch reward token update
        require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to update");
        require(_walletAddresses.length > 0, "Batch size cannot be 0");
        require(_walletAddresses.length <= maximumBatchSizeForUpdateRewards, "Batch size exceeds the defined limit");
        require(_walletAddresses.length == _hyaxRewards.length, "Array lengths must match");

        // Iterate through the list of wallets
        for (uint256 i = 0; i < _walletAddresses.length; i++) {

            //Try to update the rewards for the current wallet address
            try this.updateRewardsSingle(_walletAddresses[i], _hyaxRewards[i]) {

            } catch Error(string memory _errorMessage) {
                emit RewardUpdateFailed(msg.sender, _walletAddresses[i], _errorMessage);
            }
        }

        emit RewardUpdateBatchSent(msg.sender, _walletAddresses, _hyaxRewards);
    }

    /**
     * @notice Updates the rewards for a single wallet internally
     * @dev This function updates the rewards for a single wallet address internally.
     * @param _walletAddress The address of the wallet to update rewards for.
     * @param _hyaxRewards The amount of HYAX rewards to update for the wallet.
     */
     function updateRewardsSingle(address _walletAddress, uint256 _hyaxRewards) public onlyAdminOrRewardsUpdater {
        
        // Validate the conditions for single reward token update
        require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to update");
        require(wallets[_walletAddress].isWhitelisted == true, "Wallet is not whitelisted");
        require(wallets[_walletAddress].isBlacklisted == false, "Wallet has been blacklisted");
        require(block.timestamp >= wallets[_walletAddress].lastRewardsUpdateTime + MIN_INTERVAL_FOR_UPDATE_REWARDS, "Too soon to update rewards for this wallet");
        
        // Additional validation to ensure rewards do not exceed allowed limits
        require(_hyaxRewards <= REWARD_TOKENS_PER_WEEK, "A single wallet cannot have rewards higher than the weekly limit");
        require(_hyaxRewards <= rewardTokensInSmartContract, "Insufficient reward tokens to distribute as rewards");
        require(rewardTokensDistributed + _hyaxRewards <= REWARD_TOKENS_TOTAL, "All the reward tokens have been already distributed");
        
        // Update the last rewards update time
        wallets[_walletAddress].lastRewardsUpdateTime = block.timestamp;
        
        // Update the total rewards distributed
        rewardTokensDistributed += _hyaxRewards;

        // Update the total rewards for the wallet
        wallets[_walletAddress].totalHyaxRewardsAmount += _hyaxRewards;
    
        // Update the current rewards amount for the wallet
        wallets[_walletAddress].currentRewardsAmount += _hyaxRewards;

        // Emit an event to notify that the rewards were updated successfully
        emit RewardUpdateSuccess(msg.sender, _walletAddress, _hyaxRewards);
    }
    
    /*
     * @notice Allows whitelisted holders to withdraw their accumulated rewards
     * @dev This function is restricted to whitelisted addresses and implements a nonReentrant guard
     * @dev Rewards can be withdrawn instantly once they are distributed
     * @dev The function checks for various conditions before allowing withdrawal
     * @dev Upon successful withdrawal, it updates relevant state variables and transfers tokens
     * @return None
     */
    function withdrawRewardTokens() isWhitelisted(msg.sender) isNotBlacklisted(msg.sender) nonReentrant() isNotPaused() public {

        // Validate various conditions before allowing reward token withdrawal
        require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to withdraw");
        require(rewardTokensWithdrawn < REWARD_TOKENS_TOTAL, "All reward tokens have been withdrawn");

        uint256 withdrawableAmount = wallets[msg.sender].currentRewardsAmount;
        require(withdrawableAmount > 0, "No rewards available to withdraw");
        require(withdrawableAmount <= rewardTokensInSmartContract, "Insufficient reward tokens in the contract to withdraw");

        // Reset the current rewards amount
        wallets[msg.sender].currentRewardsAmount = 0;

        // Update the rewards withdrawn amount
        wallets[msg.sender].rewardsWithdrawn += withdrawableAmount;

        // Update the last rewards withdrawal time
        wallets[msg.sender].lastRewardsWithdrawalTime = block.timestamp;

        // Update the reward tokens in the smart contract
        rewardTokensInSmartContract -= withdrawableAmount;

        // Update the total reward tokens withdrawn
        rewardTokensWithdrawn += withdrawableAmount;

        // Transfer the calculated amount to the wallet
        bool transferSuccess = hyaxToken.transfer(msg.sender, withdrawableAmount);
        require(transferSuccess, "Failed to transfer reward tokens");

        // Emit an event to notify that the reward tokens were withdrawn
        emit RewardTokensWithdrawn(msg.sender, withdrawableAmount);
    }

    /////////////SMART CONTRACT MANAGEMENT FUNCTIONS///////////
    /**
     * @notice Allows the owner to withdraw tokens to be burned
     * @dev This function can only be called by the owner
     * @param _fundingType The type of funding to withdraw from
     * @param _amount The amount of tokens to withdraw
     * @custom:requirements Funding must have started
     * @custom:requirements Amount must be greater than 0
     */

    function withdrawTokensToBurn(FundingType _fundingType, uint256 _amount) onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant() isNotPaused() public {

        //Validate the conditions for tokens to burn withdrawal
        require(msg.sender == owner(), "Only the owner can withdraw tokens");
        require(_fundingType == FundingType.GrowthTokens || _fundingType == FundingType.TeamTokens || _fundingType == FundingType.RewardTokens, "Invalid funding type");
        require(_amount > 0, "Amount must be greater than 0");
        
        // Check the funding type and perform the necessary actions
        if(_fundingType == FundingType.GrowthTokens){
            // Ensure that growth tokens funding has started and there are sufficient growth tokens in the contract to withdraw
            require(growthTokensFundingStarted, "Growth tokens funding has not started yet, no tokens to withdraw");
            require(_amount <= growthTokensInSmartContract, "Insufficient growth tokens in the contract to withdraw");
            // Update the growth tokens in the smart contract
            growthTokensInSmartContract -= _amount;
        }
        else if(_fundingType == FundingType.TeamTokens){
            // Ensure that team tokens funding has started and there are sufficient team tokens in the contract to withdraw
            require(teamTokensFundingStarted, "Team tokens funding has not started yet, no tokens to withdraw");
            require(_amount <= teamTokensInSmartContract, "Insufficient team tokens in the contract to withdraw");
            // Update the team tokens in the smart contract
            teamTokensInSmartContract -= _amount;
        }
        else if(_fundingType == FundingType.RewardTokens){
            // Ensure that reward tokens funding has started and there are sufficient reward tokens in the contract to withdraw
            require(rewardTokensFundingStarted, "Reward tokens funding has not started yet, no tokens to withdraw");
            require(_amount <= rewardTokensInSmartContract, "Insufficient reward tokens in the contract to withdraw");
            // Update the reward tokens in the smart contract
            rewardTokensInSmartContract -= _amount;
        }
        
        // Transfer the calculated amount to the owner
        require(hyaxToken.transfer(owner(), _amount), "Failed to transfer growth tokens");

        // Emit an event to notify that the growth tokens were withdrawn    
        emit TokensToBurnWithdrawn(_fundingType, _amount);
    }

    function updateTeamMemberWallet(address _oldTeamMemberWalletAddress, address _newTeamMemberWalletAddress) public onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
    
        require(msg.sender == owner(), "Only the owner can update the team member wallet");
        require(teamTokensFundingStarted, "Team tokens funding has not started yet, no tokens to recover");

        // Validation checks for the old and new wallet addresses
        require(wallets[_oldTeamMemberWalletAddress].isTeamWallet, "Old wallet address is not a team wallet");
        require(wallets[_oldTeamMemberWalletAddress].isWhitelisted, "Old team member wallet address is not whitelisted");
        require(!wallets[_oldTeamMemberWalletAddress].isBlacklisted, "Old team member wallet address is blacklisted");
        require(_newTeamMemberWalletAddress != address(0), "New team member wallet address cannot be the zero address");
        require(_newTeamMemberWalletAddress != _oldTeamMemberWalletAddress, "New team member wallet address cannot be the same as the old team member wallet address");
        require(!wallets[_newTeamMemberWalletAddress].isWhitelisted, "New team member wallet address is already whitelisted");
        require(!wallets[_newTeamMemberWalletAddress].isTeamWallet, "New team member wallet address is already a team wallet");
        require(!wallets[_newTeamMemberWalletAddress].isBlacklisted, "New team member wallet address is blacklisted");

        // Consolidate wallet data transfer to the new address
        WalletData storage oldWallet = wallets[_oldTeamMemberWalletAddress];
        WalletData storage newWallet = wallets[_newTeamMemberWalletAddress];

        //Lock the old wallet in order to prevent potetial race conditions
        oldWallet.isWhitelisted = false;
        oldWallet.isTeamWallet = false;
        oldWallet.isBlacklisted = true;

        //Update the new wallet status
        newWallet.isWhitelisted = true;
        newWallet.isTeamWallet = true;
        newWallet.isBlacklisted = false;

        //Update the new wallet with the values of the old wallet
        newWallet.hyaxHoldingAmountAtWhitelistTime = oldWallet.hyaxHoldingAmountAtWhitelistTime;
        newWallet.hyaxHoldingAmount = oldWallet.hyaxHoldingAmount;
        newWallet.addedToWhitelistTime = oldWallet.addedToWhitelistTime;
        newWallet.teamTokenWithdrawalTimes = oldWallet.teamTokenWithdrawalTimes;

        // Clear the old wallet’s data in a single step
        oldWallet.hyaxHoldingAmountAtWhitelistTime = 0;
        oldWallet.hyaxHoldingAmount = 0;
        oldWallet.teamTokenWithdrawalTimes = 0;

        //Validate the new status of the wallets
        require(wallets[_newTeamMemberWalletAddress].isWhitelisted == true && wallets[_newTeamMemberWalletAddress].addedToWhitelistTime != 0
            && wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmountAtWhitelistTime == 0 && wallets[_oldTeamMemberWalletAddress].hyaxHoldingAmount == 0,
            "Failed to update the team member wallet");

        // Emit an event to notify of the update
        emit TeamMemberWalletUpdated(_oldTeamMemberWalletAddress, _newTeamMemberWalletAddress, newWallet.hyaxHoldingAmount);
    }

    /**
     * @notice Updates the white lister address
     * @dev This function can only be called by the admin
     * @param _whiteListerAddress The address of the new white lister
     */
    function updateWhiteListerAddress(address _whiteListerAddress) onlyRole(DEFAULT_ADMIN_ROLE) public {
        // Validate that the white lister address is not the zero address
        require(_whiteListerAddress != address(0), "White lister address cannot be the zero address");

        //Revoke role to the previous white lister address
        revokeRole(WHITELISTER_ROLE, whiteListerAddress);

        //Grant the role to the new white lister address
        grantRole(WHITELISTER_ROLE, _whiteListerAddress);

        // Update the white lister address
        whiteListerAddress = _whiteListerAddress;

        emit WhiteListerAddressUpdated(_whiteListerAddress);
    }

    /**
     * @notice Updates the rewards updater address
     * @dev This function can only be called by the admin
     * @param _rewardsUpdaterAddress The address of the new rewards updater
     */
    function updateRewardsUpdaterAddress(address _rewardsUpdaterAddress) onlyRole(DEFAULT_ADMIN_ROLE) public {
        // Validate that the rewards updater address is not the zero address
        require(_rewardsUpdaterAddress != address(0), "Rewards updater address cannot be the zero address");

        //Revoke role to the previous rewards updater address
        revokeRole(REWARDS_UPDATER_ROLE, rewardsUpdaterAddress);

        //Grant the role to the new rewards updater address
        grantRole(REWARDS_UPDATER_ROLE, _rewardsUpdaterAddress);

        // Update the rewards updater address
        rewardsUpdaterAddress = _rewardsUpdaterAddress;

        emit RewardsUpdaterAddressUpdated(_rewardsUpdaterAddress);
    }

    /**
     * @notice Updates the hyax token address
     * @dev This function can only be called by the admin
     * @param _hyaxTokenAddress The address of the new hyax token
     */
    function updateHyaxTokenAddress(address _hyaxTokenAddress) onlyRole(DEFAULT_ADMIN_ROLE) public {
        
        // Validate the conditions for hyax token address update
        require(msg.sender == owner(), "Only the owner can update the hyax token address");
        require(_hyaxTokenAddress != address(0), "Hyax token address cannot be the zero address");

        // Validate that the token is a valid HYAX token
        IHyaxToken newHyaxToken = IHyaxToken(_hyaxTokenAddress);

        // Validate that the token is a valid HYAX token    
        require(keccak256(abi.encodePacked(newHyaxToken.symbol())) == keccak256(abi.encodePacked("HYAX")), 
            "Token address must be a valid HYAX token address");

        // Update the hyax token address
        hyaxTokenAddress = _hyaxTokenAddress;

        // Update the hyax token
        hyaxToken = IHyaxToken(hyaxTokenAddress);

        emit HyaxTokenAddressUpdated(_hyaxTokenAddress);
    }

    /**
     * @notice Updates the maximum batch size for update rewards
     * @dev This function can only be called by the admin
     * @param _maximumBatchSizeForUpdateRewards The maximum batch size for update rewards
     */
    function updateMaximumBatchSizeForUpdateRewards(uint8 _maximumBatchSizeForUpdateRewards) onlyRole(DEFAULT_ADMIN_ROLE) public {
        // Validate that the maximum batch size is greater than 0 and does not exceed 100
        require(_maximumBatchSizeForUpdateRewards > 0, "Maximum batch size cannot be 0");
        require(_maximumBatchSizeForUpdateRewards <= 100, "Maximum batch size cannot be greater than 100");
        
        // Update the maximum batch size for update rewards
        maximumBatchSizeForUpdateRewards = _maximumBatchSizeForUpdateRewards;

        emit MaximumBatchSizeForUpdateRewardsUpdated(_maximumBatchSizeForUpdateRewards);
    }
    

    /**
     * @notice Returns the owner of the contract
     * @dev This function can only be called by the owner
     * @return The address of the owner
     */
    function owner() public view returns (address) {
    // Returns the first account with the DEFAULT_ADMIN_ROLE
        return getRoleMember(DEFAULT_ADMIN_ROLE, 0);
    }

     /**
     * @dev Pauses all functionalities of the contract.
     * Can only be called by the admin.
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all functionalities of the contract.
     * Can only be called by the owner.
     */
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current admin.
     * @param newOwner The address of the new admin.
     */
    function transferOwnership(address newOwner) public virtual onlyRole(DEFAULT_ADMIN_ROLE) {

        // Validate the conditions for ownership transfer
        require(msg.sender == owner(), "Only the owner can transfer ownership");
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        require(newOwner != address(this), "Ownable: new owner cannot be the same contract address");
        
        // Grant the role to the new owner
        grantRole(DEFAULT_ADMIN_ROLE, newOwner);

        // Revoke the role from the current owner
        revokeRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
}
