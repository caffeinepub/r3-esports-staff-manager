import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Int "mo:core/Int";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type UserRole = {
    #owner;
    #seniorAdmin;
    #admin;
    #staff;
  };

  type UserProfile = {
    id : Nat;
    username : Text;
    password : Text;
    role : UserRole;
    lastCheckIn : Int;
    inactivityWarnings : Nat;
    demotionWarning : Bool;
    isOnline : Bool;
  };

  type Notification = {
    id : Nat;
    message : Text;
    timestamp : Int;
    isRead : Bool;
  };

  type Announcement = {
    id : Nat;
    authorUsername : Text;
    message : Text;
    timestamp : Int;
  };

  var nextUserId : Nat = 1;
  var nextNotificationId : Nat = 1;
  var nextAnnouncementId : Nat = 1;
  var initialized : Bool = false;
  var rolesMigrated : Bool = false;

  let users = Map.empty<Nat, UserProfile>();
  let usersByUsername = Map.empty<Text, Nat>();
  let sessions = Map.empty<Principal, Nat>();
  let notifications = Map.empty<Nat, [Notification]>();
  let announcements = Map.empty<Nat, Announcement>();

  // #admin is treated as #staff; #seniorAdmin is its own tier
  func normalizeRole(role : UserRole) : UserRole {
    switch (role) {
      case (#admin) { #staff };
      case (other) { other };
    };
  };

  func roleToText(role : UserRole) : Text {
    switch (normalizeRole(role)) {
      case (#owner) { "owner" };
      case (#seniorAdmin) { "seniorAdmin" };
      case (_) { "staff" };
    };
  };

  let FIXED_PASSWORDS : [Text] = [
    "Eris_Tiger_4792",
    "Neptune_Jaguar_7320",
    "Europa_Jaguar_8776",
    "Ceres_Jaguar_1736",
    "Mars_Eagle_5291",
    "Venus_Wolf_6834",
    "Titan_Hawk_3157",
    "Luna_Bear_9423",
    "Pluto_Fox_2648",
    "Ganymede_Lion_7081",
    "Callisto_Lynx_4519",
    "Io_Raven_8362",
    "Triton_Drake_1947",
    "Phobos_Puma_6205",
    "Saturn_Viper_3874",
    "Mercury_Cobra_7412",
    "Jupiter_Bison_2563",
    "Earth_Moose_9187",
    "Deimos_Orca_4826",
    "Europa_Falcon_1359",
    "Mars_Panther_6743",
    "Venus_Tiger_2918",
    "Titan_Eagle_8451",
    "Luna_Shark_5067",
    "Neptune_Wolf_3294",
    "Eris_Bear_7836",
    "Pluto_Hawk_1582",
    "Ganymede_Fox_9347",
    "Callisto_Lion_4691",
    "Io_Jaguar_2175",
    "Triton_Lynx_8523",
    "Phobos_Raven_6014",
    "Saturn_Drake_3782",
    "Mercury_Puma_9461",
    "Jupiter_Viper_1843",
    "Earth_Cobra_7256",
    "Deimos_Bison_4392",
    "Europa_Moose_8617",
    "Mars_Orca_2945",
    "Venus_Falcon_6381",
    "Titan_Panther_1074",
    "Luna_Tiger_9528",
    "Neptune_Eagle_3867",
    "Eris_Shark_7143",
    "Pluto_Wolf_2496",
    "Ganymede_Bear_8729",
    "Callisto_Hawk_5013",
    "Io_Fox_1387",
    "Triton_Lion_6842",
    "Phobos_Jaguar_4275",
    "Saturn_Lynx_9631",
    "Mercury_Raven_2158",
    "Jupiter_Drake_7394",
    "Earth_Puma_3816",
    "Deimos_Viper_1529",
    "Europa_Cobra_8743",
    "Mars_Bison_4067",
    "Venus_Moose_2931",
    "Titan_Orca_6418",
    "Luna_Falcon_9752",
    "Neptune_Panther_1346",
    "Eris_Tiger_5819",
    "Pluto_Eagle_3274",
    "Ganymede_Shark_8136",
    "Callisto_Wolf_4592",
    "Io_Bear_7813",
    "Triton_Hawk_2467",
    "Phobos_Fox_9124",
    "Saturn_Lion_6358",
    "Mercury_Jaguar_1843",
    "Jupiter_Lynx_5279",
    "Earth_Raven_8641",
    "Deimos_Drake_3107",
    "Europa_Puma_7462",
    "Mars_Viper_2918",
    "Venus_Cobra_6384",
    "Titan_Bison_1753",
    "Luna_Moose_9217",
    "Neptune_Orca_4836",
    "Eris_Falcon_8193",
    "Pluto_Panther_2574",
    "Ganymede_Tiger_7031",
    "Callisto_Eagle_5468",
    "Io_Shark_1892",
    "Triton_Wolf_6347",
    "Phobos_Bear_3715",
    "Saturn_Hawk_9284",
    "Mercury_Fox_2651",
    "Jupiter_Lion_7918",
    "Earth_Jaguar_4372",
    "Deimos_Lynx_8635",
    "Europa_Raven_1249",
    "Mars_Drake_5793",
    "Venus_Puma_3168",
    "Titan_Viper_9524",
    "Luna_Cobra_2847",
    "Neptune_Bison_6413",
    "Eris_Moose_1076",
    "Pluto_Orca_8362",
    "Ganymede_Falcon_4729",
    "Callisto_Panther_2153",
    "Io_Tiger_7836",
    "Triton_Eagle_5294",
    "Phobos_Shark_1678",
    "Saturn_Wolf_9143",
    "Mercury_Bear_3517",
    "Jupiter_Hawk_6872",
    "Earth_Fox_2341",
    "Deimos_Lion_8756",
    "Europa_Jaguar_4213",
    "Mars_Lynx_9567",
    "Venus_Raven_1834",
    "Titan_Drake_6291",
    "Luna_Puma_3748",
    "Neptune_Viper_8125",
    "Eris_Cobra_2479",
    "Pluto_Bison_6834",
    "Ganymede_Moose_1357",
    "Callisto_Orca_7612",
    "Io_Falcon_4985",
    "Triton_Panther_2318",
    "Phobos_Tiger_8671",
    "Saturn_Eagle_3124",
    "Mercury_Shark_9487",
    "Jupiter_Wolf_1852",
    "Earth_Bear_6315",
    "Deimos_Hawk_4768",
    "Europa_Fox_2193",
    "Mars_Lion_8546",
    "Venus_Jaguar_5971",
    "Titan_Lynx_1324",
    "Luna_Raven_7683",
    "Neptune_Drake_3246",
    "Eris_Puma_9512",
    "Pluto_Viper_4867",
    "Ganymede_Cobra_2134",
    "Callisto_Bison_7589",
    "Io_Moose_5023",
    "Triton_Orca_1476",
    "Phobos_Falcon_8742",
    "Saturn_Panther_3195",
    "Mercury_Tiger_6458",
    "Jupiter_Eagle_2913",
    "Earth_Shark_9276",
    "Deimos_Wolf_4631",
    "Europa_Bear_1987",
    "Mars_Hawk_8342",
    "Venus_Fox_5716",
    "Titan_Lion_3169",
    "Luna_Jaguar_7524",
    "Neptune_Lynx_2847",
    "Eris_Raven_6213",
    "Pluto_Drake_9578",
    "Ganymede_Puma_1943",
    "Callisto_Viper_5376",
    "Io_Cobra_2819",
    "Triton_Bison_7134",
    "Phobos_Moose_4597",
    "Saturn_Orca_1852",
    "Mercury_Falcon_8217",
    "Jupiter_Panther_3672"
  ];

  func getFixedPassword(id : Nat) : Text {
    if (id == 0) { return "Staff_Member_0" };
    let idx = Nat.sub(id, 1);
    if (idx < FIXED_PASSWORDS.size()) {
      FIXED_PASSWORDS[idx];
    } else {
      "Staff_Member_" # id.toText();
    };
  };

  func isOwner(role : UserRole) : Bool {
    switch (normalizeRole(role)) {
      case (#owner) { true };
      case (_) { false };
    };
  };

  func isOwnerOrSenior(role : UserRole) : Bool {
    switch (normalizeRole(role)) {
      case (#owner or #seniorAdmin) { true };
      case (_) { false };
    };
  };

  func canDemote(actorRole : UserRole, targetRole : UserRole) : Bool {
    switch (normalizeRole(actorRole)) {
      case (#owner) {
        switch (normalizeRole(targetRole)) {
          case (#owner) { false };
          case (_) { true };
        };
      };
      case (#seniorAdmin) {
        // seniorAdmin can only demote/warn regular staff
        switch (normalizeRole(targetRole)) {
          case (#staff) { true };
          case (_) { false };
        };
      };
      case (_) { false };
    };
  };

  func computeInactivityDays(lastCheckIn : Int) : Nat {
    let now = Time.now();
    let diff = now - lastCheckIn;
    let days = diff / (24 * 60 * 60 * 1_000_000_000);
    Int.abs(days);
  };

  func addNotification(userId : Nat, message : Text) {
    let notif : Notification = {
      id = nextNotificationId;
      message;
      timestamp = Time.now();
      isRead = false;
    };
    nextNotificationId += 1;
    let existing = switch (notifications.get(userId)) {
      case (null) { [] };
      case (?arr) { arr };
    };
    notifications.add(userId, existing.concat([notif]));
  };

  func migrateRoles() {
    // Restore SeniorAdmin1-10 (ids 5-14) back to #seniorAdmin
    for ((userId, user) in users.entries()) {
      if (userId >= 5 and userId <= 14) {
        switch (user.role) {
          case (#staff) {
            let restored : UserProfile = {
              id = user.id;
              username = user.username;
              password = user.password;
              role = #seniorAdmin;
              lastCheckIn = user.lastCheckIn;
              inactivityWarnings = user.inactivityWarnings;
              demotionWarning = user.demotionWarning;
              isOnline = user.isOnline;
            };
            users.add(userId, restored);
          };
          case (_) {};
        };
      } else {
        // Normalize any remaining admin -> staff
        switch (user.role) {
          case (#admin) {
            let migrated : UserProfile = {
              id = user.id;
              username = user.username;
              password = user.password;
              role = #staff;
              lastCheckIn = user.lastCheckIn;
              inactivityWarnings = user.inactivityWarnings;
              demotionWarning = user.demotionWarning;
              isOnline = user.isOnline;
            };
            users.add(userId, migrated);
          };
          case (_) {};
        };
      };
    };
    rolesMigrated := true;
  };

  system func preupgrade() {};
  system func postupgrade() {
    if (not initialized) {
      initializeAccounts();
    } else if (not rolesMigrated) {
      migrateRoles();
    };
  };

  func initializeAccounts() {
    var id = 1;

    for (i in Nat.range(1, 4)) {
      let username = "Owner" # i.toText();
      let password = getFixedPassword(id);
      let user : UserProfile = {
        id; username; password; role = #owner;
        lastCheckIn = 0; inactivityWarnings = 0;
        demotionWarning = false; isOnline = false;
      };
      users.add(id, user);
      usersByUsername.add(username, id);
      notifications.add(id, []);
      id += 1;
    };

    for (i in Nat.range(1, 10)) {
      let username = "SeniorAdmin" # i.toText();
      let password = getFixedPassword(id);
      let user : UserProfile = {
        id; username; password; role = #seniorAdmin;
        lastCheckIn = 0; inactivityWarnings = 0;
        demotionWarning = false; isOnline = false;
      };
      users.add(id, user);
      usersByUsername.add(username, id);
      notifications.add(id, []);
      id += 1;
    };

    for (i in Nat.range(1, 20)) {
      let username = "Admin" # i.toText();
      let password = getFixedPassword(id);
      let user : UserProfile = {
        id; username; password; role = #staff;
        lastCheckIn = 0; inactivityWarnings = 0;
        demotionWarning = false; isOnline = false;
      };
      users.add(id, user);
      usersByUsername.add(username, id);
      notifications.add(id, []);
      id += 1;
    };

    for (i in Nat.range(1, 125)) {
      let username = "Staff" # i.toText();
      let password = getFixedPassword(id);
      let user : UserProfile = {
        id; username; password; role = #staff;
        lastCheckIn = 0; inactivityWarnings = 0;
        demotionWarning = false; isOnline = false;
      };
      users.add(id, user);
      usersByUsername.add(username, id);
      notifications.add(id, []);
      id += 1;
    };

    nextUserId := id;
    initialized := true;
    rolesMigrated := true;
  };

  // AUTHENTICATION
  public shared ({ caller }) func login(username : Text, password : Text) : async { #ok : { userId : Nat; role : Text }; #err : Text } {
    switch (usersByUsername.get(username)) {
      case (null) { #err("Invalid username or password") };
      case (?userId) {
        switch (users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            if (user.password == password) {
              sessions.add(caller, userId);
              #ok({ userId = user.id; role = roleToText(user.role) });
            } else {
              #err("Invalid username or password");
            };
          };
        };
      };
    };
  };

  public query ({ caller }) func getCurrentUser() : async ?UserProfile {
    switch (sessions.get(caller)) {
      case (null) { null };
      case (?userId) { users.get(userId) };
    };
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    switch (sessions.get(caller)) {
      case (null) { null };
      case (?userId) { users.get(userId) };
    };
  };

  public query func getUserProfile(user : Principal) : async ?UserProfile {
    switch (sessions.get(user)) {
      case (null) { null };
      case (?userId) { users.get(userId) };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    switch (sessions.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Not logged in") };
      case (?userId) {
        if (userId != profile.id) {
          Runtime.trap("Unauthorized: Can only update your own profile");
        };
        users.add(userId, profile);
      };
    };
  };

  // ATTENDANCE
  public shared ({ caller }) func checkIn(userId : Nat) : async () {
    switch (sessions.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != userId) {
          Runtime.trap("Unauthorized: Can only check in yourself");
        };
        switch (users.get(userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            let updated : UserProfile = {
              id = user.id; username = user.username; password = user.password;
              role = user.role; lastCheckIn = Time.now();
              inactivityWarnings = user.inactivityWarnings;
              demotionWarning = user.demotionWarning; isOnline = true;
            };
            users.add(userId, updated);
          };
        };
      };
    };
  };

  public shared ({ caller }) func checkOut(userId : Nat) : async () {
    switch (sessions.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != userId) {
          Runtime.trap("Unauthorized: Can only check out yourself");
        };
        switch (users.get(userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?user) {
            let updated : UserProfile = {
              id = user.id; username = user.username; password = user.password;
              role = user.role; lastCheckIn = user.lastCheckIn;
              inactivityWarnings = user.inactivityWarnings;
              demotionWarning = user.demotionWarning; isOnline = false;
            };
            users.add(userId, updated);
          };
        };
      };
    };
  };

  public query func getAttendanceBoard() : async [{ userId : Nat; username : Text; role : Text; isOnline : Bool; lastCheckIn : Int; inactivityDays : Nat }] {
    users.values().toArray().map(
      func(user : UserProfile) : { userId : Nat; username : Text; role : Text; isOnline : Bool; lastCheckIn : Int; inactivityDays : Nat } {
        {
          userId = user.id; username = user.username;
          role = roleToText(user.role); isOnline = user.isOnline;
          lastCheckIn = user.lastCheckIn;
          inactivityDays = computeInactivityDays(user.lastCheckIn);
        };
      },
    );
  };

  // INACTIVITY SYSTEM
  public shared func runInactivityCheck() : async () {
    for ((userId, user) in users.entries()) {
      let days = computeInactivityDays(user.lastCheckIn);
      var updated = user;

      if (days >= 7 and not user.demotionWarning) {
        updated := {
          id = user.id; username = user.username; password = user.password;
          role = user.role; lastCheckIn = user.lastCheckIn;
          inactivityWarnings = user.inactivityWarnings;
          demotionWarning = true; isOnline = user.isOnline;
        };
        users.add(userId, updated);
        for ((uid, u) in users.entries()) {
          if (isOwnerOrSenior(u.role)) {
            addNotification(uid, user.username # " has been inactive for 7+ days and is marked for demotion");
          };
        };
      } else if (days >= 5 and user.inactivityWarnings == 0) {
        updated := {
          id = user.id; username = user.username; password = user.password;
          role = user.role; lastCheckIn = user.lastCheckIn;
          inactivityWarnings = 1;
          demotionWarning = user.demotionWarning; isOnline = user.isOnline;
        };
        users.add(userId, updated);
      };
    };
  };

  // NOTIFICATIONS
  public query ({ caller }) func getNotifications(userId : Nat) : async [Notification] {
    switch (sessions.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        switch (users.get(sessionUserId)) {
          case (null) { Runtime.trap("Session user not found") };
          case (?sessionUser) {
            if (sessionUserId != userId and not isOwnerOrSenior(sessionUser.role)) {
              Runtime.trap("Unauthorized: Can only view your own notifications");
            };
            switch (notifications.get(userId)) {
              case (null) { [] };
              case (?arr) { arr };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func markNotificationRead(notifId : Nat) : async () {
    switch (sessions.get(caller)) {
      case (null) { Runtime.trap("Unauthorized: Not logged in") };
      case (?userId) {
        switch (notifications.get(userId)) {
          case (null) {};
          case (?notifs) {
            let updated = notifs.map(
              func(n : Notification) : Notification {
                if (n.id == notifId) {
                  { id = n.id; message = n.message; timestamp = n.timestamp; isRead = true };
                } else { n };
              },
            );
            notifications.add(userId, updated);
          };
        };
      };
    };
  };

  // ANNOUNCEMENTS
  public shared ({ caller }) func sendAnnouncement(userId : Nat, message : Text) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != userId) { return #err("Unauthorized: userId mismatch") };
        switch (users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            if (not isOwnerOrSenior(user.role)) {
              return #err("Unauthorized: Only owners and senior admins can send announcements");
            };
            let announcement : Announcement = {
              id = nextAnnouncementId;
              authorUsername = user.username;
              message;
              timestamp = Time.now();
            };
            announcements.add(nextAnnouncementId, announcement);
            nextAnnouncementId += 1;
            for ((uid, _) in users.entries()) {
              addNotification(uid, "Announcement from " # user.username # ": " # message);
            };
            #ok;
          };
        };
      };
    };
  };

  public query func getAnnouncements() : async [Announcement] {
    announcements.values().toArray();
  };

  // DEMOTION / WARNING
  public shared ({ caller }) func demoteUser(initiatorUserId : Nat, targetUserId : Nat) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != initiatorUserId) {
          return #err("Unauthorized: initiatorUserId mismatch");
        };
        switch (users.get(initiatorUserId)) {
          case (null) { #err("Initiator user not found") };
          case (?initiator) {
            switch (users.get(targetUserId)) {
              case (null) { #err("Target user not found") };
              case (?target) {
                if (not canDemote(initiator.role, target.role)) {
                  return #err("Unauthorized: Cannot demote this user");
                };
                let updated : UserProfile = {
                  id = target.id; username = target.username; password = target.password;
                  role = target.role; lastCheckIn = target.lastCheckIn;
                  inactivityWarnings = target.inactivityWarnings;
                  demotionWarning = true; isOnline = target.isOnline;
                };
                users.add(targetUserId, updated);
                #ok;
              };
            };
          };
        };
      };
    };
  };

  // ISSUE WARNING (manual inactivity warning by owner or seniorAdmin)
  public shared ({ caller }) func issueWarning(initiatorUserId : Nat, targetUserId : Nat) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != initiatorUserId) {
          return #err("Unauthorized: initiatorUserId mismatch");
        };
        switch (users.get(initiatorUserId)) {
          case (null) { #err("Initiator user not found") };
          case (?initiator) {
            if (not isOwnerOrSenior(initiator.role)) {
              return #err("Unauthorized: Only owners and senior admins can issue warnings");
            };
            switch (users.get(targetUserId)) {
              case (null) { #err("Target user not found") };
              case (?target) {
                if (not canDemote(initiator.role, target.role)) {
                  return #err("Unauthorized: Cannot warn this user");
                };
                let updated : UserProfile = {
                  id = target.id; username = target.username; password = target.password;
                  role = target.role; lastCheckIn = target.lastCheckIn;
                  inactivityWarnings = target.inactivityWarnings + 1;
                  demotionWarning = target.demotionWarning; isOnline = target.isOnline;
                };
                users.add(targetUserId, updated);
                addNotification(targetUserId, "You have received a warning from " # initiator.username);
                #ok;
              };
            };
          };
        };
      };
    };
  };

  public query func getDemotionCandidates() : async [UserProfile] {
    users.values().toArray().filter<UserProfile>(func(u : UserProfile) : Bool { u.demotionWarning });
  };

  // ADMIN PANEL
  public query ({ caller }) func getAllUsers(requesterId : Nat) : async { #ok : [UserProfile]; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != requesterId) {
          return #err("Unauthorized: requesterId mismatch");
        };
        switch (users.get(requesterId)) {
          case (null) { #err("Requester not found") };
          case (?requester) {
            if (not isOwnerOrSenior(requester.role)) {
              return #err("Unauthorized: Only owners and senior admins can view all users");
            };
            #ok(users.values().toArray());
          };
        };
      };
    };
  };

  public query func getUserById(userId : Nat) : async ?UserProfile {
    users.get(userId);
  };

  public query ({ caller }) func getAllPasswords(requesterId : Nat) : async { #ok : [{ username : Text; password : Text; role : Text }]; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != requesterId) {
          return #err("Unauthorized: requesterId mismatch");
        };
        switch (users.get(requesterId)) {
          case (null) { #err("Requester not found") };
          case (?requester) {
            if (not isOwner(requester.role)) {
              return #err("Unauthorized: Only owners can view all passwords");
            };
            let result = users.values().toArray().map(
              func(u : UserProfile) : { username : Text; password : Text; role : Text } {
                { username = u.username; password = u.password; role = roleToText(u.role) };
              },
            );
            #ok(result);
          };
        };
      };
    };
  };

  // CHANGE PASSWORD (self-service)
  public shared ({ caller }) func changePassword(userId : Nat, currentPassword : Text, newPassword : Text) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != userId) { return #err("Unauthorized: userId mismatch") };
        switch (users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            if (user.password != currentPassword) {
              return #err("Current password is incorrect");
            };
            if (newPassword.size() < 6) {
              return #err("New password must be at least 6 characters");
            };
            let updated : UserProfile = {
              id = user.id; username = user.username; password = newPassword;
              role = user.role; lastCheckIn = user.lastCheckIn;
              inactivityWarnings = user.inactivityWarnings;
              demotionWarning = user.demotionWarning; isOnline = user.isOnline;
            };
            users.add(userId, updated);
            #ok;
          };
        };
      };
    };
  };

  // ADMIN CHANGE PASSWORD
  public shared ({ caller }) func adminChangePassword(requesterId : Nat, targetUserId : Nat, newPassword : Text) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != requesterId) { return #err("Unauthorized: requesterId mismatch") };
        switch (users.get(requesterId)) {
          case (null) { #err("Requester not found") };
          case (?requester) {
            if (not isOwner(requester.role)) {
              return #err("Unauthorized: Only owners can change other users' passwords");
            };
            switch (users.get(targetUserId)) {
              case (null) { #err("Target user not found") };
              case (?target) {
                if (newPassword.size() < 6) {
                  return #err("New password must be at least 6 characters");
                };
                let updated : UserProfile = {
                  id = target.id; username = target.username; password = newPassword;
                  role = target.role; lastCheckIn = target.lastCheckIn;
                  inactivityWarnings = target.inactivityWarnings;
                  demotionWarning = target.demotionWarning; isOnline = target.isOnline;
                };
                users.add(targetUserId, updated);
                #ok;
              };
            };
          };
        };
      };
    };
  };

  // CHANGE USERNAME (self-service)
  public shared ({ caller }) func changeUsername(userId : Nat, currentPassword : Text, newUsername : Text) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != userId) { return #err("Unauthorized: userId mismatch") };
        switch (users.get(userId)) {
          case (null) { #err("User not found") };
          case (?user) {
            if (user.password != currentPassword) {
              return #err("Current password is incorrect");
            };
            let trimmed = newUsername.trim(#char ' ');
            if (trimmed.size() < 3) {
              return #err("Username must be at least 3 characters");
            };
            if (trimmed.size() > 30) {
              return #err("Username must be 30 characters or fewer");
            };
            if (trimmed == user.username) {
              return #err("New username must differ from current username");
            };
            switch (usersByUsername.get(trimmed)) {
              case (?_) { return #err("Username is already taken") };
              case (null) {};
            };
            ignore usersByUsername.remove(user.username);
            usersByUsername.add(trimmed, userId);
            let updated : UserProfile = {
              id = user.id; username = trimmed; password = user.password;
              role = user.role; lastCheckIn = user.lastCheckIn;
              inactivityWarnings = user.inactivityWarnings;
              demotionWarning = user.demotionWarning; isOnline = user.isOnline;
            };
            users.add(userId, updated);
            #ok;
          };
        };
      };
    };
  };

  // ADMIN CHANGE USERNAME
  public shared ({ caller }) func adminChangeUsername(requesterId : Nat, targetUserId : Nat, newUsername : Text) : async { #ok; #err : Text } {
    switch (sessions.get(caller)) {
      case (null) { #err("Unauthorized: Not logged in") };
      case (?sessionUserId) {
        if (sessionUserId != requesterId) { return #err("Unauthorized: requesterId mismatch") };
        switch (users.get(requesterId)) {
          case (null) { #err("Requester not found") };
          case (?requester) {
            if (not isOwner(requester.role)) {
              return #err("Unauthorized: Only owners can change other users' usernames");
            };
            switch (users.get(targetUserId)) {
              case (null) { #err("Target user not found") };
              case (?target) {
                let trimmed = newUsername.trim(#char ' ');
                if (trimmed.size() < 3) {
                  return #err("Username must be at least 3 characters");
                };
                if (trimmed.size() > 30) {
                  return #err("Username must be 30 characters or fewer");
                };
                if (trimmed == target.username) {
                  return #err("New username must differ from current username");
                };
                switch (usersByUsername.get(trimmed)) {
                  case (?_) { return #err("Username is already taken") };
                  case (null) {};
                };
                ignore usersByUsername.remove(target.username);
                usersByUsername.add(trimmed, targetUserId);
                let updated : UserProfile = {
                  id = target.id; username = trimmed; password = target.password;
                  role = target.role; lastCheckIn = target.lastCheckIn;
                  inactivityWarnings = target.inactivityWarnings;
                  demotionWarning = target.demotionWarning; isOnline = target.isOnline;
                };
                users.add(targetUserId, updated);
                #ok;
              };
            };
          };
        };
      };
    };
  };
};
