
https://www.narda-sts.com/en/servicesupport/software-updates-and-firmware/srm/#download_11648

./node_modules/.bin/electron-rebuild

 "target": [
    {
        "target": "nsis",
        "arch": [
            "x64",
            "ia32"
        ]
    }
]

## 先卸载
npm uninstall sqlite3

## 再安装
npm install sqlite3 --runtime=electron --target=5.0.7 --dist-url=https://atom.io/download/electron --save



使用模块加载原生node 
native-ext-loader




[General]

# Defaults to 'BlueZ X.YZ', if Name is not set here and plugin 'hostname' is not loaded.
# The plugin 'hostname' is loaded by default and overides the Name set here so
# consider modifying /etc/machine-info with variable PRETTY_HOSTNAME=<NewName> instead.
#Name = BlueZ

# Default device class. Only the major and minor device class bits are
# considered. Defaults to '0x000000'.
#Class = 0x000100

# How long to stay in discoverable mode before going back to non-discoverable
# The value is in seconds. Default is 180, i.e. 3 minutes.
# 0 = disable timer, i.e. stay discoverable forever
DiscoverableTimeout = 0

# How long to stay in pairable mode before going back to non-discoverable
# The value is in seconds. Default is 0.
# 0 = disable timer, i.e. stay pairable forever
#PairableTimeout = 0

# Use vendor id source (assigner), vendor, product and version information for
# DID profile support. The values are separated by ":" and assigner, VID, PID
# and version.
# Possible vendor id source values: bluetooth, usb (defaults to usb)
#DeviceID = bluetooth:1234:5678:abcd

# Do reverse service discovery for previously unknown devices that connect to
# us. This option is really only needed for qualification since the BITE tester
# doesn't like us doing reverse SDP for some test cases (though there could in
# theory be other useful purposes for this too). Defaults to 'true'.
#ReverseServiceDiscovery = true

# Enable name resolving after inquiry. Set it to 'false' if you don't need
# remote devices name and want shorter discovery cycle. Defaults to 'true'.
#NameResolving = true

# Enable runtime persistency of debug link keys. Default is false which
# makes debug link keys valid only for the duration of the connection
# that they were created for.
#DebugKeys = false

# Restricts all controllers to the specified transport. Default value
# is "dual", i.e. both BR/EDR and LE enabled (when supported by the HW).
# Possible values: "dual", "bredr", "le"
#ControllerMode = dual

# Enables Multi Profile Specification support. This allows to specify if
# system supports only Multiple Profiles Single Device (MPSD) configuration
# or both Multiple Profiles Single Device (MPSD) and Multiple Profiles Multiple
# Devices (MPMD) configurations.
# Possible values: "off", "single", "multiple"
#MultiProfile = off

# Permanently enables the Fast Connectable setting for adapters that
# support it. When enabled other devices can connect faster to us,
# however the tradeoff is increased power consumptions. This feature
# will fully work only on kernel version 4.1 and newer. Defaults to
# 'false'.
#FastConnectable = false

# Default privacy setting.
# Enables use of private address.
# Possible values: "off", "device", "network"
# "network" option not supported currently
# Defaults to "off"
# Privacy = off

[GATT]
# GATT attribute cache.
# Possible values:
# always: Always cache attributes even for devices not paired, this is
# recommended as it is best for interoperability, with more consistent
# reconnection times and enables proper tracking of notifications for all
# devices.
# yes: Only cache attributes of paired devices.
# no: Never cache attributes
# Default: always
#Cache = always

# Minimum required Encryption Key Size for accessing secured characteristics.
# Possible values: 0 and 7-16. 0 means don't care.
# Defaults to 0
# MinEncKeySize = 0

[Policy]
#
# The ReconnectUUIDs defines the set of remote services that should try
# to be reconnected to in case of a link loss (link supervision
# timeout). The policy plugin should contain a sane set of values by
# default, but this list can be overridden here. By setting the list to
# empty the reconnection feature gets disabled.
#ReconnectUUIDs=00001112-0000-1000-8000-00805f9b34fb,0000111f-0000-1000-8000-00805f9b34fb,0000110a-0000-1000-8000-00805f9b34fb

# ReconnectAttempts define the number of attempts to reconnect after a link
# lost. Setting the value to 0 disables reconnecting feature.
#ReconnectAttempts=7

# ReconnectIntervals define the set of intervals in seconds to use in between
# attempts.
# If the number of attempts defined in ReconnectAttempts is bigger than the
# set of intervals the last interval is repeated until the last attempt.
#ReconnectIntervals=1,2,4,8,16,32,64

# AutoEnable defines option to enable all controllers when they are found.
# This includes adapters present on start as well as adapters that are plugged
# in later on. Defaults to 'false'.
AutoEnable=true
