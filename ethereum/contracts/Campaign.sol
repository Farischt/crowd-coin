// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

contract CampaignFactory {
  address payable[] public deployedCampaigns;

  function createCampaign(uint256 minimumAmountToDonate) public {
    address newCampaign = address(
      new Campaign(minimumAmountToDonate, msg.sender)
    );
    deployedCampaigns.push(payable(newCampaign));
  }

  function getDeployedCampaigns()
    public
    view
    returns (address payable[] memory)
  {
    return deployedCampaigns;
  }
}

contract Campaign {
  enum State {
    Ongoing,
    Done
  }

  struct Request {
    string description;
    uint256 value;
    address payable recipient;
    bool complete;
    State state;
    uint256 approverCount;
    mapping(address => bool) approvers;
  }

  /**
   * @notice owner is the smart contract original deployer
   * He is responsible for managing requests
   */
  address public owner;

  /**
   * @notice
   */
  mapping(address => bool) public contributors;
  uint256 public contributorCount;
  uint256 public minimumContribution;
  Request[] public requests;

  constructor(uint256 minimum, address creator) {
    setMinimumContribution(minimum);
    setOwner(creator);
  }

  function getOwner() public view returns (address) {
    return owner;
  }

  function setOwner(address newOwner) public {
    owner = newOwner;
  }

  function getContributorCount() public view returns (uint256) {
    return contributorCount;
  }

  function getMinimumContribution() public view returns (uint256) {
    return minimumContribution;
  }

  function setMinimumContribution(uint256 newMinimumContribution) public {
    minimumContribution = newMinimumContribution;
  }

  function isContributor(address payable contributorAddress)
    public
    view
    returns (bool)
  {
    return contributors[contributorAddress] == true;
  }

  error OnlyOwner();
  error OnlyContributor();
  error OnlyNonVoter();

  modifier onlyOwner() {
    if (msg.sender != owner) {
      revert OnlyOwner();
    }
    _;
  }

  modifier onlyContributor() {
    if (!contributors[msg.sender]) {
      revert OnlyContributor();
    }
    _;
  }

  modifier onlyNonVoter(uint256 index) {
    if (requests[index].approvers[msg.sender]) {
      revert OnlyNonVoter();
    }
    _;
  }

  function contribute() public payable {
    require(
      msg.value > minimumContribution,
      "Please make sure to send at least the minimum contribution."
    );
    contributors[msg.sender] = true;
    contributorCount++;
  }

  function createRequest(
    string memory description,
    uint256 value,
    address payable recipient
  ) public onlyOwner {
    Request storage request = requests.push();
    request.description = description;
    request.value = value;
    request.recipient = recipient;
    request.complete = false;
    request.state = State.Ongoing;
    request.approverCount = 0;
  }

  function approveRequest(uint256 requestIndex)
    public
    onlyContributor
    onlyNonVoter(requestIndex)
  {
    // We store the request as a storage variable because we modify it
    Request storage request = requests[requestIndex];
    request.approvers[msg.sender] = true;
    request.approverCount++;
  }

  function finalizeRequest(uint256 requestIndex) public payable onlyOwner {
    Request storage request = requests[requestIndex];
    require(request.state == State.Ongoing, "Request is not ongoing !");
    require(!request.complete, "Request is already done !");
    require(
      request.approverCount > (contributorCount / 2),
      "Request not approved yet !"
    );
    require(
      request.value <= address(this).balance,
      "Not enough money to finalize the request !"
    );

    request.recipient.transfer(request.value);
    request.state = State.Done;
    request.complete = true;
  }

  function getSummary()
    public
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256,
      address
    )
  {
    return (
      minimumContribution,
      address(this).balance,
      requests.length,
      contributorCount,
      owner
    );
  }

  function getRequestsCount() public view returns (uint256) {
    return requests.length;
  }
}
