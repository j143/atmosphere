def xen_to_kvm_ubuntu(self, mounted_path):
    """
    These operations must be run to convert an Ubuntu Machine from XEN-based
    virtualization to KVM-based virtualization
    """
    remove_line_file_list = [
            #("pattern_match", "file_to_test")
            ("atmo_boot",  "etc/rc.local"),
            ("sda2", "etc/fstab"),
            ("sda3",  "etc/fstab")]
    _remove_line_in_files(remove_line_file_list)


def xen_to_kvm_centos(self, mounted_path):
    #replace \t w/ 4-space if this doesn't work so well..
    prepend_line_list = [
        ("LABEL=root\t\t/\t\t\text3\tdefaults,errors=remount-ro 1 1",
        "etc/fstab"),
        ]
    remove_line_file_list = [("alias scsi", "etc/modprobe.conf"),
                             ("atmo_boot", "etc/rc.local")]

    replace_line_file_list = [("^\/dev\/sda", "\#\/dev\/sda", "etc/fstab"),
                              ("^xvc0", "\#xvc0", "etc/inittab"),
                              ("xenblk", "ata_piix", "etc/modprobe.conf"),
                              ("xennet", "8139cp", "etc/modprobe.conf")]:
    multiline_delete_files = [
        ("depmod -a","\/usr\/bin\/ruby \/usr\/sbin\/atmo_boot", "etc/rc.local"),
        ("depmod -a","\/usr\/bin\/ruby \/usr\/sbin\/atmo_boot", "etc/rc.d/rc.local")
    ]

    _prepend_line_in_files(prepend_line_list)
    _remove_line_in_files(remove_line_file_list)
    _replace_line_in_files(replace_line_file_list)
    _remove_multiline_in_files(multiline_delete_files)

    ### PREPARE CHROOT

    #Run this command in a prepared chroot
    run_command(["/usr/sbin/chroot", mount_point, "/bin/bash", "-c",
                 "yum install -qy kernel mkinitrd grub"]],

    #Run this command in a prepared chroot
    latest_rmdisk, rmdisk_version = get_latest_ramdisk(mounted_path)

    #Next, Create a brand new ramdisk using the KVM variables set above
    run_command(["/usr/sbin/chroot", mount_point, "/bin/bash", "-c",
                "mkinitrd --with virtio_pci --with virtio_ring "
                "--with virtio_blk --with virtio_net "
                "--with virtio_balloon --with virtio "
                "-f /boot/%s %s"  % (latest_rmdisk, rmdisk_version)])

    ### REMOVE PREPARED CHROOT